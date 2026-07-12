"""Tests for sustainability calculations."""

from __future__ import annotations

from app.engine.calculator import (
    WASTE_DIVERSION_TARGET,
    calculate_waste_diversion_rate,
)


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
