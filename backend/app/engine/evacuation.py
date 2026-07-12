"""StadiumIQ Domain Engine — evacuation calculations."""

from typing import Any

from app.engine.sources import (
    EVACUATION_SOURCE,
    FLOW_RATE_PER_METER_PER_MIN,
    FLOW_RATE_SOURCE,
    MAX_EVACUATION_MINUTES,
)


def calculate_evacuation_time(
    capacity: int,
    exit_width_m: float,
    flow_rate: float = FLOW_RATE_PER_METER_PER_MIN,
) -> dict[str, Any]:
    """Calculate the theoretical full-venue evacuation time.

    Uses the SGSA Green Guide flow-rate model: total throughput =
    exit_width_m × flow_rate persons/m/min.

    Args:
        capacity: Total number of spectators to evacuate.
        exit_width_m: Aggregate effective exit width in metres.
        flow_rate: Persons per metre width per minute (default 82).

    Returns:
        Dict with evacuation_time_minutes, meets_standard, standard_minutes,
        margin_minutes, and source.
    """
    throughput = exit_width_m * flow_rate
    evac_time = capacity / throughput if throughput > 0 else float("inf")
    evac_time_rounded = round(evac_time, 2)
    meets = evac_time_rounded <= MAX_EVACUATION_MINUTES
    margin = round(MAX_EVACUATION_MINUTES - evac_time_rounded, 2)

    return {
        "evacuation_time_minutes": evac_time_rounded,
        "meets_standard": meets,
        "standard_minutes": MAX_EVACUATION_MINUTES,
        "margin_minutes": margin,
        "source": EVACUATION_SOURCE,
        "flow_rate_source": FLOW_RATE_SOURCE,
    }
