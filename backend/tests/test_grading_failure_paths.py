"""Tests for grading failure-path branches.

These tests specifically exercise the code paths that fire when a venue
is *not* meeting safety/compliance standards — the most operationally
important branches in the grading engine.
"""

from __future__ import annotations

from unittest.mock import patch

from app.engine.grading import _score_to_grade, grade_venue_readiness


class TestScoreToGradeBoundaries:
    """Verify every grade boundary, including D and F."""

    def test_a_plus(self) -> None:
        assert _score_to_grade(95.0) == "A+"
        assert _score_to_grade(100.0) == "A+"

    def test_a(self) -> None:
        assert _score_to_grade(90.0) == "A"
        assert _score_to_grade(94.9) == "A"

    def test_b(self) -> None:
        assert _score_to_grade(80.0) == "B"
        assert _score_to_grade(89.9) == "B"

    def test_c(self) -> None:
        assert _score_to_grade(70.0) == "C"
        assert _score_to_grade(79.9) == "C"

    def test_d(self) -> None:
        assert _score_to_grade(60.0) == "D"
        assert _score_to_grade(69.9) == "D"

    def test_f(self) -> None:
        assert _score_to_grade(59.9) == "F"
        assert _score_to_grade(0.0) == "F"


class TestGradingFailurePaths:
    """Exercise the failure/penalty branches in grade_venue_readiness."""

    def test_evacuation_penalty_proportional(self) -> None:
        """When evacuation exceeds the 8-min standard, the score is
        proportionally penalised and the recommendation is generated.

        BMO: capacity=45000, exit_width=26m → evac ≈ 21.11 min.
        evac_score = max(0, round(8 / 21.11 * 100, 2)) ≈ 37.9.
        """
        result = grade_venue_readiness(
            "bmo",
            {"gate_a": 1.0},  # safe density
            waste_recycled_kg=950.0,
            waste_total_kg=1000.0,  # good recycling
        )
        evac_score = result["breakdown"]["evacuation"]["score"]
        assert evac_score < 100.0, "Evacuation should be penalised"
        assert evac_score > 0.0, "Score should not be zero"

        # Recommendation must mention the specific evacuation shortfall
        evac_recs = [r for r in result["recommendations"] if "Evacuation" in r]
        assert len(evac_recs) == 1
        assert "exceeds" in evac_recs[0]
        assert "8-minute standard" in evac_recs[0]

    def test_accessibility_deficit_recommendation(self) -> None:
        """When wheelchair ratio < 1%, the recommendation is generated
        with the specific deficit count.

        We mock venue data with a wheelchair ratio well below 1%.
        """
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 50000,
            "exit_width_m": 200.0,  # wide enough to pass evacuation easily
            "wheelchair_seats": 100,  # 0.2% — far below 1% ADA minimum
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                {"gate_a": 1.0},
                waste_recycled_kg=950.0,
                waste_total_kg=1000.0,
            )

        access_score = result["breakdown"]["accessibility"]["score"]
        assert access_score < 100.0

        access_recs = [r for r in result["recommendations"] if "Wheelchair" in r]
        assert len(access_recs) == 1
        assert "below ADA minimum" in access_recs[0]
        assert "add" in access_recs[0].lower()

    def test_waste_diversion_failure_recommendation(self) -> None:
        """When waste diversion < 90% target, the recommendation fires."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 50000,
            "exit_width_m": 200.0,
            "wheelchair_seats": 600,  # above 1%
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                {"gate_a": 1.0},
                waste_recycled_kg=200.0,
                waste_total_kg=1000.0,  # only 20% diversion
            )

        sustain_score = result["breakdown"]["sustainability"]["score"]
        assert sustain_score < 100.0

        waste_recs = [r for r in result["recommendations"] if "diversion" in r.lower()]
        assert len(waste_recs) == 1
        assert "below" in waste_recs[0]
        assert "90" in waste_recs[0]

    def test_crowd_density_elevated_recommendation(self) -> None:
        """When average crowd score < 70 (warning/critical zones),
        the 'open additional concourses' recommendation fires."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 50000,
            "exit_width_m": 200.0,
            "wheelchair_seats": 600,
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                # All zones at density 5.0 → "critical" tier → score 10 each
                {"gate_a": 5.0, "gate_b": 5.0, "gate_c": 5.0},
                waste_recycled_kg=950.0,
                waste_total_kg=1000.0,
            )

        crowd_score = result["breakdown"]["crowd_safety"]["score"]
        assert crowd_score < 70.0

        crowd_recs = [r for r in result["recommendations"] if "density" in r.lower()]
        assert len(crowd_recs) == 1
        assert "additional concourses" in crowd_recs[0]

    def test_all_failures_produce_f_grade(self) -> None:
        """A venue failing on every dimension should receive an F."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 100000,
            "exit_width_m": 5.0,  # tiny exits → terrible evacuation
            "wheelchair_seats": 10,  # 0.01% → accessibility failure
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                # All zones critical
                {"gate_a": 5.0, "gate_b": 5.0},
                waste_recycled_kg=10.0,
                waste_total_kg=1000.0,  # 1% diversion
            )

        assert result["grade"] == "F"
        assert result["score"] < 60.0

        # Should have ALL four categories of recommendations
        rec_text = " ".join(result["recommendations"])
        assert "density" in rec_text.lower()
        assert "Evacuation" in rec_text
        assert "Wheelchair" in rec_text
        assert "diversion" in rec_text.lower()

    def test_all_passing_no_failure_recommendations(self) -> None:
        """A venue passing everything should get the 'maintain operations'
        message and no failure recommendations."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 10000,
            "exit_width_m": 200.0,  # huge exits → instant evac
            "wheelchair_seats": 200,  # 2% → well above ADA
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                {"gate_a": 0.5},  # very low density
                waste_recycled_kg=950.0,
                waste_total_kg=1000.0,
            )

        assert result["recommendations"] == [
            "All metrics within acceptable ranges. Maintain current operations."
        ]

    def test_d_grade_boundary(self) -> None:
        """Composite score in 60-69 range should produce exactly a D."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 10000,
            "exit_width_m": 200.0,  # passes evac → 100
            "wheelchair_seats": 200,  # passes ADA → 100
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            # Crowd: all warning density (3.5-4.5) → tier "warning" → score 40
            # Evac: 100, Access: 100, Sustain: ~55.6% of target → 61.78
            # Composite: 40*0.4 + 100*0.2 + 100*0.2 + 61.78*0.2
            #          = 16 + 20 + 20 + 12.36 = 68.36 → D
            result = grade_venue_readiness(
                "test_venue",
                {"gate_a": 4.0, "gate_b": 4.0, "gate_c": 4.0},
                waste_recycled_kg=500.0,
                waste_total_kg=1000.0,  # 50% diversion → 55.56 score
            )

        assert result["grade"] == "D"
        assert 60.0 <= result["score"] < 70.0

    def test_empty_zones_default_safe(self) -> None:
        """Empty zone_densities dict should default to safe (100) crowd score."""
        mock_venue = {
            "venue_id": "test_venue",
            "name": "Test Stadium",
            "capacity": 10000,
            "exit_width_m": 200.0,
            "wheelchair_seats": 200,
        }
        with patch("app.engine.calculator.get_venue_info", return_value=mock_venue):
            result = grade_venue_readiness(
                "test_venue",
                {},  # empty
                waste_recycled_kg=950.0,
                waste_total_kg=1000.0,
            )

        assert result["breakdown"]["crowd_safety"]["score"] == 100.0
