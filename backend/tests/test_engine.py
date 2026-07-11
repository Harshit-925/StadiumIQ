"""Exhaustive tests for the StadiumIQ domain engine (calculator.py).

Tests every public function with exact boundary assertions.  No external
services are touched — these are pure-function unit tests.
"""

from __future__ import annotations

import math

import pytest

from app.engine.calculator import (
    MAX_EVACUATION_MINUTES,
    VENUES,
    WASTE_DIVERSION_TARGET,
    WHEELCHAIR_RATIO,
    analyze_venue,
    assess_accessibility_compliance,
    calculate_evacuation_time,
    calculate_waste_diversion_rate,
    calculate_zone_occupancy,
    classify_crowd_density,
    get_venue_info,
    grade_venue_readiness,
    recommend_route,
)

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  classify_crowd_density                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestClassifyCrowdDensity:
    """Boundary-value tests for crowd-density classification."""

    def test_safe_below_2(self) -> None:
        """1.9 pax/m² → safe."""
        result = classify_crowd_density(1.9)
        assert result["level"] == "safe"
        assert result["color"] == "green"

    def test_moderate_at_2(self) -> None:
        """2.0 pax/m² → moderate (boundary)."""
        result = classify_crowd_density(2.0)
        assert result["level"] == "moderate"
        assert result["color"] == "yellow"

    def test_warning_at_3_5(self) -> None:
        """3.5 pax/m² → warning (boundary)."""
        result = classify_crowd_density(3.5)
        assert result["level"] == "warning"
        assert result["color"] == "orange"

    def test_warning_at_4_5(self) -> None:
        """4.5 pax/m² → still warning (inclusive upper bound)."""
        result = classify_crowd_density(4.5)
        assert result["level"] == "warning"
        assert result["color"] == "orange"

    def test_critical_above_4_5(self) -> None:
        """4.6 pax/m² → critical."""
        result = classify_crowd_density(4.6)
        assert result["level"] == "critical"
        assert result["color"] == "red"

    def test_zero_density_safe(self) -> None:
        """0.0 pax/m² → safe (empty venue)."""
        result = classify_crowd_density(0.0)
        assert result["level"] == "safe"

    def test_has_source_citation(self) -> None:
        """Result must include the source citation."""
        result = classify_crowd_density(1.0)
        assert "source" in result
        assert "Keith Still" in result["source"]

    def test_has_action_required(self) -> None:
        """Result must include action_required field."""
        result = classify_crowd_density(5.0)
        assert "action_required" in result
        assert "EMERGENCY" in result["action_required"]


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  calculate_evacuation_time                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestCalculateEvacuationTime:
    """Tests for evacuation-time calculation."""

    def test_metlife_evacuation(self) -> None:
        """MetLife: 82500 / (45.0 * 82) = ~22.36 min — fails 8-min standard."""
        result = calculate_evacuation_time(82500, 45.0)
        expected = round(82500 / (45.0 * 82), 2)
        assert result["evacuation_time_minutes"] == expected
        assert result["meets_standard"] is False
        assert result["standard_minutes"] == MAX_EVACUATION_MINUTES

    def test_small_venue_passes(self) -> None:
        """A small venue with wide exits should pass."""
        # 1000 people, 10m exit → 1000/(10*82) = ~1.22 min
        result = calculate_evacuation_time(1000, 10.0)
        assert result["meets_standard"] is True
        assert result["margin_minutes"] > 0

    def test_custom_flow_rate(self) -> None:
        """Verify custom flow rate is used."""
        result = calculate_evacuation_time(1000, 10.0, flow_rate=100)
        assert result["evacuation_time_minutes"] == round(1000 / (10.0 * 100), 2)

    def test_zero_exit_width(self) -> None:
        """Zero exit width → infinite evacuation time."""
        result = calculate_evacuation_time(1000, 0.0)
        assert result["evacuation_time_minutes"] == float("inf")
        assert result["meets_standard"] is False

    def test_has_source_citations(self) -> None:
        """Result must cite both evacuation and flow-rate sources."""
        result = calculate_evacuation_time(1000, 10.0)
        assert "source" in result
        assert "flow_rate_source" in result


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  calculate_zone_occupancy                                              ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestCalculateZoneOccupancy:
    """Tests for zone occupancy calculation."""

    def test_basic_occupancy(self) -> None:
        """100 entries, 20 exits, 50 sqm → 80 people, 1.6 pax/m²."""
        result = calculate_zone_occupancy(100, 20, 50.0)
        assert result["current_occupants"] == 80
        assert result["density_pax_per_sqm"] == 1.6
        assert result["classification"]["level"] == "safe"

    def test_more_exits_than_entries(self) -> None:
        """More exits than entries → 0 occupants (clamped)."""
        result = calculate_zone_occupancy(10, 50, 100.0)
        assert result["current_occupants"] == 0

    def test_zero_area(self) -> None:
        """Zero area → density 0.0 (avoid division by zero)."""
        result = calculate_zone_occupancy(100, 0, 0.0)
        assert result["density_pax_per_sqm"] == 0.0


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  assess_accessibility_compliance                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestAccessibilityCompliance:
    """Tests for ADA wheelchair-seating compliance."""

    def test_metlife_passes(self) -> None:
        """MetLife: 900/82500 = ~1.09% → passes ADA 1% minimum."""
        result = assess_accessibility_compliance(900, 82500)
        assert result["ratio"] == round(900 / 82500, 4)
        assert result["meets_ada"] is True

    def test_below_minimum_fails(self) -> None:
        """500 seats out of 100000 = 0.5% → fails ADA."""
        result = assess_accessibility_compliance(500, 100000)
        assert result["meets_ada"] is False
        assert result["surplus_deficit"] < 0

    def test_exact_minimum(self) -> None:
        """Exactly 1% → passes ADA."""
        result = assess_accessibility_compliance(1000, 100000)
        assert result["meets_ada"] is True
        assert result["surplus_deficit"] == 0

    def test_required_minimum_rounds_up(self) -> None:
        """Required minimum should be ceil(capacity * 0.01)."""
        result = assess_accessibility_compliance(10, 999)
        expected_min = math.ceil(999 * WHEELCHAIR_RATIO)  # 10
        assert result["required_minimum"] == expected_min

    def test_has_source(self) -> None:
        """Result must cite ADA source."""
        result = assess_accessibility_compliance(100, 10000)
        assert "ADA" in result["source"]


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  calculate_waste_diversion_rate                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestWasteDiversionRate:
    """Tests for waste diversion rate."""

    def test_eighty_percent_fails(self) -> None:
        """800/1000 = 80% → fails 90% target."""
        result = calculate_waste_diversion_rate(800.0, 1000.0)
        assert result["diversion_rate_pct"] == 80.0
        assert result["meets_target"] is False
        assert result["target_pct"] == WASTE_DIVERSION_TARGET
        assert result["gap_pct"] == 10.0

    def test_ninety_percent_passes(self) -> None:
        """900/1000 = 90% → meets target."""
        result = calculate_waste_diversion_rate(900.0, 1000.0)
        assert result["meets_target"] is True

    def test_hundred_percent(self) -> None:
        """1000/1000 = 100% → exceeds target."""
        result = calculate_waste_diversion_rate(1000.0, 1000.0)
        assert result["diversion_rate_pct"] == 100.0
        assert result["meets_target"] is True
        assert result["gap_pct"] == -10.0

    def test_zero_total_waste(self) -> None:
        """0 total waste → 0% diversion (avoid division by zero)."""
        result = calculate_waste_diversion_rate(0.0, 0.0)
        assert result["diversion_rate_pct"] == 0.0

    def test_has_source(self) -> None:
        """Result must cite EPA/FIFA source."""
        result = calculate_waste_diversion_rate(100.0, 200.0)
        assert "EPA" in result["source"]



# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  recommend_route                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestRecommendRoute:
    """Tests for deterministic routing recommendations."""

    def test_finds_lowest_density(self) -> None:
        """Should return the index with the lowest density."""
        result = recommend_route([4.0, 5.0, 1.2, 3.5])
        assert result["recommended_zone_index"] == 2
        assert result["recommended_zone_density"] == 1.2
        assert "Zone 3" in result["reason"]

    def test_empty_densities(self) -> None:
        """Should handle empty list gracefully."""
        result = recommend_route([])
        assert result["recommended_zone_index"] is None
        assert result["recommended_zone_density"] is None

    def test_all_equal_densities(self) -> None:
        """Should pick the first one if all are equal."""
        result = recommend_route([2.5, 2.5, 2.5])
        assert result["recommended_zone_index"] == 0

    def test_has_source(self) -> None:
        """Must include source citation."""
        result = recommend_route([1.0])
        assert "source" in result


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  get_venue_info                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestGetVenueInfo:
    """Tests for venue lookup."""

    def test_valid_venue(self) -> None:
        """Looking up 'metlife' returns correct data."""
        venue = get_venue_info("metlife")
        assert venue["name"] == "MetLife Stadium"
        assert venue["capacity"] == 82500
        assert venue["venue_id"] == "metlife"

    def test_case_insensitive(self) -> None:
        """Venue lookup should be case-insensitive."""
        venue = get_venue_info("MetLife")
        assert venue["name"] == "MetLife Stadium"

    def test_invalid_venue_raises(self) -> None:
        """Unknown venue → ValueError."""
        with pytest.raises(ValueError, match="Unknown venue"):
            get_venue_info("nonexistent")

    def test_all_venues_exist(self) -> None:
        """All 16 venues must exist with required fields."""
        required_fields = {"name", "city", "country", "capacity", "exit_width_m", "zones", "wheelchair_seats"}
        assert len(VENUES) == 16
        for vid, vdata in VENUES.items():
            for field in required_fields:
                assert field in vdata, f"Venue '{vid}' missing field '{field}'"

    def test_all_venues_retrievable(self) -> None:
        """Every venue in VENUES can be retrieved by get_venue_info."""
        for vid in VENUES:
            info = get_venue_info(vid)
            assert info["venue_id"] == vid


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  grade_venue_readiness                                                 ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestGradeVenueReadiness:
    """Tests for composite venue readiness grading."""

    def test_all_safe_high_recycling(self) -> None:
        """All zones safe + high recycling → high grade with recommendations."""
        result = grade_venue_readiness(
            "bmo",
            [1.0, 1.5, 0.5, 1.0],
            waste_recycled_kg=950.0,
            waste_total_kg=1000.0,
        )
        assert result["grade"] in ("A+", "A", "B", "C", "D", "F")
        assert 0 <= result["score"] <= 100
        assert "breakdown" in result
        assert "recommendations" in result

    def test_critical_zones_low_grade(self) -> None:
        """All zones critical + low recycling → poor grade."""
        result = grade_venue_readiness(
            "metlife",
            [5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0, 5.0],
            waste_recycled_kg=100.0,
            waste_total_kg=1000.0,
        )
        # Critical zones (score 10) + bad waste → low composite
        assert result["score"] < 50
        assert result["grade"] in ("D", "F")

    def test_breakdown_weights(self) -> None:
        """Breakdown weights must sum to 1.0."""
        result = grade_venue_readiness("azteca", [2.0], 500.0, 1000.0)
        breakdown = result["breakdown"]
        total_weight = sum(v["weight"] for v in breakdown.values())
        assert abs(total_weight - 1.0) < 0.001

    def test_invalid_venue_raises(self) -> None:
        """Invalid venue ID → ValueError."""
        with pytest.raises(ValueError):
            grade_venue_readiness("invalid", [1.0], 100.0, 200.0)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  analyze_venue (master function)                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestAnalyzeVenue:
    """Tests for the master analysis function."""

    def test_full_analysis_structure(self) -> None:
        """analyze_venue returns all expected top-level keys."""
        result = analyze_venue(
            venue_id="sofi",
            zone_densities=[1.0, 2.0, 3.0],
            waste_recycled_kg=500.0,
            waste_total_kg=1000.0,
        )
        assert "venue" in result
        assert "zone_analyses" in result
        assert "evacuation" in result
        assert "accessibility" in result
        assert "waste_diversion" in result
        assert "readiness" in result
        assert "route_recommendation" in result

    def test_zone_count_matches(self) -> None:
        """Number of zone analyses should match input densities."""
        densities = [1.0, 2.5, 3.5, 4.5]
        result = analyze_venue("hardrock", densities, 200.0, 500.0)
        assert len(result["zone_analyses"]) == len(densities)

    def test_invalid_venue_raises(self) -> None:
        """Invalid venue → ValueError."""
        with pytest.raises(ValueError):
            analyze_venue("fake_venue", [1.0], 100.0, 200.0)
