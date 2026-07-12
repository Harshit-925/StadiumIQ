"""StadiumIQ Domain Engine — accessibility calculations."""

import math
from typing import Any

from app.engine.sources import (
    ACCESSIBILITY_SOURCE,
    WHEELCHAIR_RATIO,
)


def assess_accessibility_compliance(
    wheelchair_seats: int,
    total_capacity: int,
) -> dict[str, Any]:
    """Check wheelchair-seating compliance against ADA 1 % minimum.

    Args:
        wheelchair_seats: Number of wheelchair-accessible seats provided.
        total_capacity: Total venue seating capacity.

    Returns:
        Dict with ratio, meets_ada, required_minimum, surplus_deficit, source.
    """
    ratio = round(wheelchair_seats / total_capacity, 4) if total_capacity > 0 else 0.0
    required_minimum = math.ceil(total_capacity * WHEELCHAIR_RATIO)
    surplus_deficit = wheelchair_seats - required_minimum

    return {
        "ratio": ratio,
        "meets_ada": ratio >= WHEELCHAIR_RATIO,
        "required_minimum": required_minimum,
        "surplus_deficit": surplus_deficit,
        "source": ACCESSIBILITY_SOURCE,
    }
