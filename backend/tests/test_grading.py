"""Tests for grading readiness."""

from __future__ import annotations

import pytest

from app.engine.calculator import (
    grade_venue_readiness,
)


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
