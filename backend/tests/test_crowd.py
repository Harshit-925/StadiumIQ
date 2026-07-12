"""Tests for crowd density and routing."""

from __future__ import annotations

from app.engine.calculator import (
    calculate_zone_occupancy,
    classify_crowd_density,
    recommend_route,
)


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
