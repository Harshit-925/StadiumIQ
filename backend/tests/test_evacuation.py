"""Tests for evacuation calculation."""

from __future__ import annotations

from app.engine.calculator import (
    MAX_EVACUATION_MINUTES,
    calculate_evacuation_time,
)


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
