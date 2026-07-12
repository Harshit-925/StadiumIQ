"""StadiumIQ Domain Engine — sustainability calculations."""

from typing import Any

from app.engine.sources import (
    SUSTAINABILITY_SOURCE,
    WASTE_DIVERSION_TARGET,
)


def calculate_waste_diversion_rate(
    recycled_kg: float,
    total_waste_kg: float,
) -> dict[str, Any]:
    """Calculate the waste-diversion rate and compare to EPA target.

    Args:
        recycled_kg: Weight of waste diverted to recycling / composting.
        total_waste_kg: Total weight of waste generated.

    Returns:
        Dict with diversion_rate_pct, meets_target, target_pct, gap_pct, source.
    """
    rate = round((recycled_kg / total_waste_kg) * 100, 2) if total_waste_kg > 0 else 0.0
    gap = round(WASTE_DIVERSION_TARGET - rate, 2)

    return {
        "diversion_rate_pct": rate,
        "meets_target": rate >= WASTE_DIVERSION_TARGET,
        "target_pct": WASTE_DIVERSION_TARGET,
        "gap_pct": gap,
        "source": SUSTAINABILITY_SOURCE,
    }
