"""Tests for accessibility compliance."""

from __future__ import annotations

import math

from app.engine.calculator import (
    WHEELCHAIR_RATIO,
    assess_accessibility_compliance,
)


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
