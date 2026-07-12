"""StadiumIQ Domain Engine — orchestrator.

Domain calculations now live in dedicated modules under app/engine/; this
file re-exports them for backward compatibility and contains only the
top-level orchestration (analyze_venue, get_venue_info).
"""

from typing import Any

from app.engine.accessibility import assess_accessibility_compliance
from app.engine.crowd import (
    calculate_zone_occupancy,
    classify_crowd_density,
    recommend_route,
)
from app.engine.evacuation import calculate_evacuation_time
from app.engine.grading import grade_venue_readiness
from app.engine.sources import (
    ACCESSIBILITY_SOURCE,
    CROWD_DENSITY_SOURCE,
    EVACUATION_SOURCE,
    FLOW_RATE_SOURCE,
    MAX_EVACUATION_MINUTES,
    SUSTAINABILITY_SOURCE,
    WASTE_DIVERSION_TARGET,
    WHEELCHAIR_RATIO,
)
from app.engine.sustainability import calculate_waste_diversion_rate
from app.engine.venues import VENUES


def get_venue_info(venue_id: str) -> dict[str, Any]:
    """Look up a venue by its slug identifier.

    Args:
        venue_id: Short slug, e.g. ``"metlife"``, ``"azteca"``.

    Returns:
        The venue data dictionary.

    Raises:
        ValueError: If the venue_id is not recognised.
    """
    venue_id_lower = venue_id.lower()
    if venue_id_lower not in VENUES:
        valid = ", ".join(sorted(VENUES.keys()))
        raise ValueError(f"Unknown venue '{venue_id}'. Valid venues: {valid}")
    return {**VENUES[venue_id_lower], "venue_id": venue_id_lower}


def analyze_venue(
    venue_id: str,
    zone_densities: list[float],
    waste_recycled_kg: float,
    waste_total_kg: float,
) -> dict[str, Any]:
    """Master analysis function — aggregates all calculations for one venue.

    This is the primary entry-point called by the API route.

    Args:
        venue_id: Venue slug.
        zone_densities: Per-zone density readings (pax/m²).
        waste_recycled_kg: Recycled waste in kg.
        waste_total_kg: Total waste in kg.

    Returns:
        Comprehensive dict containing venue info, zone analyses, evacuation,
        accessibility, waste, and readiness grade.
    """
    venue = get_venue_info(venue_id)

    # Zone-level density classifications
    zone_analyses: list[dict[str, Any]] = []
    for i, density in enumerate(zone_densities):
        zone_analyses.append(
            {
                "zone_index": i,
                "density_pax_per_sqm": density,
                "classification": classify_crowd_density(density),
            }
        )

    evacuation = calculate_evacuation_time(venue["capacity"], venue["exit_width_m"])
    accessibility = assess_accessibility_compliance(
        venue["wheelchair_seats"], venue["capacity"]
    )
    waste = calculate_waste_diversion_rate(waste_recycled_kg, waste_total_kg)
    readiness = grade_venue_readiness(
        venue_id, zone_densities, waste_recycled_kg, waste_total_kg
    )
    route = recommend_route(zone_densities)

    return {
        "venue": venue,
        "zone_analyses": zone_analyses,
        "evacuation": evacuation,
        "accessibility": accessibility,
        "waste_diversion": waste,
        "readiness": readiness,
        "route_recommendation": route,
    }


__all__ = [
    "VENUES", "CROWD_DENSITY_SOURCE", "EVACUATION_SOURCE", "FLOW_RATE_SOURCE",
    "ACCESSIBILITY_SOURCE", "SUSTAINABILITY_SOURCE", "classify_crowd_density",
    "recommend_route", "calculate_zone_occupancy", "calculate_evacuation_time",
    "assess_accessibility_compliance", "calculate_waste_diversion_rate",
    "grade_venue_readiness", "get_venue_info", "analyze_venue",
    "MAX_EVACUATION_MINUTES", "WASTE_DIVERSION_TARGET", "WHEELCHAIR_RATIO",
]
