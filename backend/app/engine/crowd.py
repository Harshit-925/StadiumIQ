"""StadiumIQ Domain Engine — crowd density and routing."""

from typing import Any

from app.engine.sources import (
    CROWD_DENSITY_SOURCE,
    DENSITY_MODERATE_MAX,
    DENSITY_SAFE_MAX,
    DENSITY_WARNING_MAX,
)


def _density_tier(density_pax_per_sqm: float) -> str:
    """Return the tier key for a density value. Single source of truth —
    both classify_crowd_density() and grade_venue_readiness() must call
    this rather than repeating the threshold comparisons."""
    if density_pax_per_sqm < DENSITY_SAFE_MAX:
        return "safe"
    if density_pax_per_sqm < DENSITY_MODERATE_MAX:
        return "moderate"
    if density_pax_per_sqm <= DENSITY_WARNING_MAX:
        return "warning"
    return "critical"


def classify_crowd_density(density_pax_per_sqm: float) -> dict[str, str]:
    """Classify a crowd density value into a safety level.

    Thresholds are based on Prof. G. Keith Still's crowd-science research.

    Args:
        density_pax_per_sqm: People per square metre in the area.

    Returns:
        Dict with keys: level, description, action_required, color, source.
    """
    tier = _density_tier(density_pax_per_sqm)
    if tier == "safe":
        level, desc, action, color = (
            "safe",
            "Free movement possible. Comfortable spacing between individuals.",
            "No action required. Continue normal monitoring.",
            "green",
        )
    elif tier == "moderate":
        level, desc, action, color = (
            "moderate",
            "Movement restricted. Contact between individuals likely.",
            "Increase monitoring. Consider opening additional routes.",
            "yellow",
        )
    elif tier == "warning":
        level, desc, action, color = (
            "warning",
            "Crowd crush risk. Movement severely restricted.",
            "Activate crowd management protocols. Redirect flows immediately.",
            "orange",
        )
    else:
        level, desc, action, color = (
            "critical",
            "Immediate danger of crowd crush. No movement possible.",
            "EMERGENCY: Halt all ingress. Deploy stewards. Consider evacuation.",
            "red",
        )

    return {
        "level": level,
        "description": desc,
        "action_required": action,
        "color": color,
        "source": CROWD_DENSITY_SOURCE,
    }


def recommend_route(zone_densities: dict[str, float]) -> dict[str, Any]:
    """Recommend the least-congested zone/gate for fan egress or arrival
    routing, based on already-computed per-zone density readings.

    This is the navigation/transportation-facing output: it tells a fan or
    operator which gate to route toward right now. Deterministic — same
    inputs always produce the same recommendation.

    Args:
        zone_densities: Map of zone_id to density readings (pax/m²).

    Returns:
        Dict with:
            recommended_zone_id: str ID of the lowest-density zone.
            recommended_zone_density: float density of that zone.
            reason: str human-readable justification.
            source: str citation, matches the style of other SOURCE consts.
    """
    if not zone_densities:
        return {
            "recommended_zone_id": None,
            "recommended_zone_density": None,
            "reason": "No zone data available.",
            "source": CROWD_DENSITY_SOURCE,
        }

    best_id = min(zone_densities, key=zone_densities.get)
    best_density = zone_densities[best_id]

    return {
        "recommended_zone_id": best_id,
        "recommended_zone_density": best_density,
        "reason": (
            f"Zone '{best_id}' has the lowest current density "
            f"({best_density:.2f} pax/m²) — recommended route for entry, "
            f"exit, or transport connections."
        ),
        "source": CROWD_DENSITY_SOURCE,
    }


def calculate_zone_occupancy(
    entry_count: int,
    exit_count: int,
    zone_area_sqm: float,
) -> dict[str, Any]:
    """Compute current zone occupancy and its density classification.

    Args:
        entry_count: Cumulative entries since zone opened.
        exit_count: Cumulative exits since zone opened.
        zone_area_sqm: Area of the zone in square metres.

    Returns:
        Dict with current_occupants, density_pax_per_sqm, and classification.
    """
    occupants = max(0, entry_count - exit_count)
    density = round(occupants / zone_area_sqm, 4) if zone_area_sqm > 0 else 0.0
    classification = classify_crowd_density(density)

    return {
        "current_occupants": occupants,
        "density_pax_per_sqm": density,
        "classification": classification,
    }
