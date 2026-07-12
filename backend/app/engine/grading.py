"""StadiumIQ Domain Engine — grading and composite readiness."""

from typing import Any

from app.engine.accessibility import assess_accessibility_compliance
from app.engine.crowd import _density_tier
from app.engine.evacuation import calculate_evacuation_time
from app.engine.sources import (
    MAX_EVACUATION_MINUTES,
    WASTE_DIVERSION_TARGET,
    WHEELCHAIR_RATIO,
)
from app.engine.sustainability import calculate_waste_diversion_rate


def _score_to_grade(score: float) -> str:
    """Convert a numeric 0-100 score to a letter grade.

    Args:
        score: Numeric score between 0 and 100.

    Returns:
        A grade string from A+ to F.
    """
    if score >= 95:
        return "A+"
    if score >= 90:
        return "A"
    if score >= 80:
        return "B"
    if score >= 70:
        return "C"
    if score >= 60:
        return "D"
    return "F"


def grade_venue_readiness(
    venue_id: str,
    zone_densities: dict[str, float],
    waste_recycled_kg: float,
    waste_total_kg: float,
) -> dict[str, Any]:
    """Produce a composite readiness grade for a venue.

    Weighting:
    - Crowd safety  40 % — average zone density score
    - Evacuation    20 % — whether 8-min standard is met
    - Accessibility 20 % — ADA compliance ratio
    - Sustainability 20 % — waste diversion rate vs 90 % target

    Grade bands: A+ ≥ 95, A ≥ 90, B ≥ 80, C ≥ 70, D ≥ 60, F < 60.

    Args:
        venue_id: Venue slug.
        zone_densities: Dict of current density readings (pax/m²) per zone.
        waste_recycled_kg: Recycled waste weight in kg.
        waste_total_kg: Total waste weight in kg.

    Returns:
        Dict with grade, score, breakdown, recommendations.
    """
    from app.engine.calculator import get_venue_info

    venue = get_venue_info(venue_id)

    # ── Crowd safety score (40%) ─────────────────────────────────────────
    if zone_densities:
        _tier_score = {"safe": 100.0, "moderate": 70.0, "warning": 40.0, "critical": 10.0}
        density_scores = [_tier_score[_density_tier(d)] for d in zone_densities.values()]
        crowd_score = sum(density_scores) / len(density_scores)
    else:
        crowd_score = 100.0  # no data → assume safe

    # ── Evacuation score (20%) ───────────────────────────────────────────
    evac = calculate_evacuation_time(venue["capacity"], venue["exit_width_m"])
    if evac["meets_standard"]:
        evac_score = 100.0
    else:
        # Proportional penalty — the further over 8 min, the worse the score
        ratio = MAX_EVACUATION_MINUTES / evac["evacuation_time_minutes"]
        evac_score = max(0.0, round(ratio * 100, 2))

    # ── Accessibility score (20%) ────────────────────────────────────────
    access = assess_accessibility_compliance(
        venue["wheelchair_seats"], venue["capacity"]
    )
    access_score = 100.0 if access["meets_ada"] else max(0.0, round(access["ratio"] / WHEELCHAIR_RATIO * 100, 2))

    # ── Sustainability score (20%) ───────────────────────────────────────
    waste = calculate_waste_diversion_rate(waste_recycled_kg, waste_total_kg)
    sustain_score = min(
        100.0, round((waste["diversion_rate_pct"] / WASTE_DIVERSION_TARGET) * 100, 2)
    )

    # ── Composite ────────────────────────────────────────────────────────
    composite = round(
        crowd_score * 0.40
        + evac_score * 0.20
        + access_score * 0.20
        + sustain_score * 0.20,
        2,
    )

    grade = _score_to_grade(composite)

    # ── Recommendations ──────────────────────────────────────────────────
    recommendations: list[str] = []
    if crowd_score < 70:
        recommendations.append(
            "Crowd density is elevated — open additional concourses."
        )
    if not evac["meets_standard"]:
        recommendations.append(
            f"Evacuation time ({evac['evacuation_time_minutes']} min) exceeds "
            f"{MAX_EVACUATION_MINUTES}-minute standard — increase exit capacity."
        )
    if not access["meets_ada"]:
        recommendations.append(
            f"Wheelchair seating ({access['ratio']*100:.1f}%) below ADA minimum (1%) "
            f"— add {abs(access['surplus_deficit'])} seats."
        )
    if not waste["meets_target"]:
        recommendations.append(
            f"Waste diversion ({waste['diversion_rate_pct']}%) below "
            f"{WASTE_DIVERSION_TARGET}% target — improve recycling infrastructure."
        )
    if not recommendations:
        recommendations.append(
            "All metrics within acceptable ranges. Maintain current operations."
        )

    return {
        "grade": grade,
        "score": composite,
        "breakdown": {
            "crowd_safety": {"score": round(crowd_score, 2), "weight": 0.40},
            "evacuation": {"score": round(evac_score, 2), "weight": 0.20},
            "accessibility": {"score": round(access_score, 2), "weight": 0.20},
            "sustainability": {"score": round(sustain_score, 2), "weight": 0.20},
        },
        "recommendations": recommendations,
        "venue": venue,
    }
