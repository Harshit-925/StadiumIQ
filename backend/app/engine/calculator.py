"""StadiumIQ Domain Engine — pure deterministic stadium operations calculator.

Every number produced by this module is traceable to a published standard.
The SOURCE constants below cite the exact authority for each calculation.

This module has **zero** external dependencies — no network calls, no AI,
no database.  It is the single source of truth for all quantitative outputs.
"""

from __future__ import annotations

import math
from typing import Any

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CITED SOURCES                                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝

CROWD_DENSITY_SOURCE: str = (
    "Prof. G. Keith Still, Crowd Science — crowd density thresholds (gkstill.com)"
)
EVACUATION_SOURCE: str = (
    "SGSA Guide to Safety at Sports Grounds (Green Guide), 6th Edition "
    "— 8-minute evacuation standard"
)
FLOW_RATE_SOURCE: str = (
    "SGSA Green Guide — 82 persons per metre width per minute on level surfaces"
)
ACCESSIBILITY_SOURCE: str = (
    "ADA Standards for Accessible Design — minimum 1% wheelchair seating of total capacity"
)
SUSTAINABILITY_SOURCE: str = (
    "EPA Sustainable Materials Management / FIFA Sustainability Strategy 2024-2030"
)
STEWARD_SOURCE: str = (
    "FIFA Stadium Safety and Security Regulations — steward deployment ratios"
)

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  CONSTANTS                                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝

FLOW_RATE_PER_METER_PER_MIN: int = 82  # persons per metre width per minute
MAX_EVACUATION_MINUTES: int = 8  # FIFA/SGSA maximum
WHEELCHAIR_RATIO: float = 0.01  # 1 % minimum ADA
WASTE_DIVERSION_TARGET: float = 90.0  # percent — EPA target

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FIFA WORLD CUP 2026 VENUES                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝

VENUES: dict[str, dict[str, Any]] = {
    "metlife": {
        "name": "MetLife Stadium",
        "city": "New York/NJ",
        "country": "USA",
        "capacity": 82500,
        "exit_width_m": 45.0,
        "zones": 8,
        "wheelchair_seats": 900,
    },
    "att": {
        "name": "AT&T Stadium",
        "city": "Dallas",
        "country": "USA",
        "capacity": 94000,
        "exit_width_m": 50.0,
        "zones": 10,
        "wheelchair_seats": 1000,
    },
    "sofi": {
        "name": "SoFi Stadium",
        "city": "Los Angeles",
        "country": "USA",
        "capacity": 70000,
        "exit_width_m": 40.0,
        "zones": 8,
        "wheelchair_seats": 750,
    },
    "hardrock": {
        "name": "Hard Rock Stadium",
        "city": "Miami",
        "country": "USA",
        "capacity": 65000,
        "exit_width_m": 38.0,
        "zones": 6,
        "wheelchair_seats": 700,
    },
    "mercedes": {
        "name": "Mercedes-Benz Stadium",
        "city": "Atlanta",
        "country": "USA",
        "capacity": 75000,
        "exit_width_m": 42.0,
        "zones": 8,
        "wheelchair_seats": 800,
    },
    "nrg": {
        "name": "NRG Stadium",
        "city": "Houston",
        "country": "USA",
        "capacity": 72000,
        "exit_width_m": 40.0,
        "zones": 8,
        "wheelchair_seats": 770,
    },
    "arrowhead": {
        "name": "Arrowhead Stadium",
        "city": "Kansas City",
        "country": "USA",
        "capacity": 73000,
        "exit_width_m": 41.0,
        "zones": 8,
        "wheelchair_seats": 780,
    },
    "levis": {
        "name": "Levi's Stadium",
        "city": "San Francisco",
        "country": "USA",
        "capacity": 71000,
        "exit_width_m": 40.0,
        "zones": 8,
        "wheelchair_seats": 760,
    },
    "lincoln": {
        "name": "Lincoln Financial Field",
        "city": "Philadelphia",
        "country": "USA",
        "capacity": 69000,
        "exit_width_m": 39.0,
        "zones": 8,
        "wheelchair_seats": 740,
    },
    "lumen": {
        "name": "Lumen Field",
        "city": "Seattle",
        "country": "USA",
        "capacity": 69000,
        "exit_width_m": 39.0,
        "zones": 8,
        "wheelchair_seats": 740,
    },
    "gillette": {
        "name": "Gillette Stadium",
        "city": "Boston",
        "country": "USA",
        "capacity": 65000,
        "exit_width_m": 38.0,
        "zones": 6,
        "wheelchair_seats": 700,
    },
    "azteca": {
        "name": "Estadio Azteca",
        "city": "Mexico City",
        "country": "Mexico",
        "capacity": 83000,
        "exit_width_m": 44.0,
        "zones": 8,
        "wheelchair_seats": 850,
    },
    "bbva": {
        "name": "Estadio BBVA",
        "city": "Monterrey",
        "country": "Mexico",
        "capacity": 53500,
        "exit_width_m": 32.0,
        "zones": 6,
        "wheelchair_seats": 550,
    },
    "akron": {
        "name": "Estadio Akron",
        "city": "Guadalajara",
        "country": "Mexico",
        "capacity": 48000,
        "exit_width_m": 28.0,
        "zones": 6,
        "wheelchair_seats": 500,
    },
    "bcplace": {
        "name": "BC Place",
        "city": "Vancouver",
        "country": "Canada",
        "capacity": 54000,
        "exit_width_m": 33.0,
        "zones": 6,
        "wheelchair_seats": 560,
    },
    "bmo": {
        "name": "BMO Field",
        "city": "Toronto",
        "country": "Canada",
        "capacity": 45000,
        "exit_width_m": 26.0,
        "zones": 4,
        "wheelchair_seats": 480,
    },
}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  PURE FUNCTIONS                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝


def classify_crowd_density(density_pax_per_sqm: float) -> dict[str, str]:
    """Classify a crowd density value into a safety level.

    Thresholds are based on Prof. G. Keith Still's crowd-science research.

    Args:
        density_pax_per_sqm: People per square metre in the area.

    Returns:
        Dict with keys: level, description, action_required, color, source.
    """
    if density_pax_per_sqm < 2.0:
        level, desc, action, color = (
            "safe",
            "Free movement possible. Comfortable spacing between individuals.",
            "No action required. Continue normal monitoring.",
            "green",
        )
    elif density_pax_per_sqm < 3.5:
        level, desc, action, color = (
            "moderate",
            "Movement restricted. Contact between individuals likely.",
            "Increase monitoring. Consider opening additional routes.",
            "yellow",
        )
    elif density_pax_per_sqm <= 4.5:
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


def calculate_steward_requirement(
    spectator_count: int,
    risk_level: str = "low",
) -> dict[str, Any]:
    """Determine the minimum number of stewards for a given crowd size.

    FIFA specifies deployment ratios based on risk assessment:
    - Low risk:  1 steward per 250 spectators
    - High risk: 1 steward per 100 spectators

    Args:
        spectator_count: Number of spectators expected.
        risk_level: ``"low"`` or ``"high"``.

    Returns:
        Dict with stewards_needed, ratio, risk_level, source.
    """
    risk = risk_level.lower()
    if risk == "high":
        ratio_denominator = 100
        ratio_str = "1:100"
    else:
        ratio_denominator = 250
        ratio_str = "1:250"

    stewards = math.ceil(spectator_count / ratio_denominator)

    return {
        "stewards_needed": stewards,
        "ratio": ratio_str,
        "risk_level": risk,
        "source": STEWARD_SOURCE,
    }


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


def grade_venue_readiness(
    venue_id: str,
    zone_densities: list[float],
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
        zone_densities: List of current density readings (pax/m²) per zone.
        waste_recycled_kg: Recycled waste weight in kg.
        waste_total_kg: Total waste weight in kg.

    Returns:
        Dict with grade, score, breakdown, recommendations.
    """
    venue = get_venue_info(venue_id)

    # ── Crowd safety score (40%) ─────────────────────────────────────────
    if zone_densities:
        density_scores = []
        for d in zone_densities:
            if d < 2.0:
                density_scores.append(100.0)
            elif d < 3.5:
                density_scores.append(70.0)
            elif d <= 4.5:
                density_scores.append(40.0)
            else:
                density_scores.append(10.0)
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
    if access["meets_ada"]:
        access_score = 100.0
    else:
        access_score = max(0.0, round((access["ratio"] / WHEELCHAIR_RATIO) * 100, 2))

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


def analyze_venue(
    venue_id: str,
    zone_densities: list[float],
    waste_recycled_kg: float,
    waste_total_kg: float,
    spectator_count: int,
    risk_level: str = "low",
) -> dict[str, Any]:
    """Master analysis function — aggregates all calculations for one venue.

    This is the primary entry-point called by the API route.

    Args:
        venue_id: Venue slug.
        zone_densities: Per-zone density readings (pax/m²).
        waste_recycled_kg: Recycled waste in kg.
        waste_total_kg: Total waste in kg.
        spectator_count: Current or expected spectator count.
        risk_level: ``"low"`` or ``"high"`` risk classification.

    Returns:
        Comprehensive dict containing venue info, zone analyses, evacuation,
        accessibility, waste, steward requirements, and readiness grade.
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
    stewards = calculate_steward_requirement(spectator_count, risk_level)
    readiness = grade_venue_readiness(
        venue_id, zone_densities, waste_recycled_kg, waste_total_kg
    )

    return {
        "venue": venue,
        "zone_analyses": zone_analyses,
        "evacuation": evacuation,
        "accessibility": accessibility,
        "waste_diversion": waste,
        "steward_requirement": stewards,
        "readiness": readiness,
    }


# ── Private helpers ──────────────────────────────────────────────────────


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
