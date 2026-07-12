"""StadiumIQ Domain Engine — emergency and incident triage."""

from __future__ import annotations

from typing import Any

from app.engine.crowd import classify_crowd_density

# Mock live sensor data for demonstration purposes
MOCK_ZONE_DENSITIES = {
    "gate_a": 1.2,
    "gate_b": 2.5,
    "gate_c": 0.8,
    "concourse_north": 4.1,  # Warning level
    "concourse_south": 5.5,  # Critical level
    "section_lower_bowl": 3.0,
    "section_upper_bowl": 1.5,
}

INCIDENT_WEIGHTS = {
    "medical": 1.5,
    "violence": 2.0,
    "suspicious_package": 2.5,
    "unauthorized_entry": 1.2,
    "spill": 0.5,
}

def triage_incident(incident_type: str, severity: int, zone: str, zone_density: float | None = None) -> dict[str, Any]:
    """Deterministic routing for incidents with density escalation.

    Assigns priority level based on a weighted matrix of incident type
    and severity, and escalates if the affected zone is dangerously crowded.

    Args:
        incident_type: The type of incident (e.g. 'medical', 'violence').
        severity: Scale 1-5 (1=lowest, 5=highest).
        zone: The zone ID where the incident occurred.

    Returns:
        Dict containing triage details and action plan.
    """
    base_weight = INCIDENT_WEIGHTS.get(incident_type, 1.0)
    score = severity * base_weight

    # Use live density if provided, otherwise fallback to mock sensor data
    density = zone_density if zone_density is not None else MOCK_ZONE_DENSITIES.get(zone, 1.0)
    crowd_status = classify_crowd_density(density)

    action_plan = []
    escalated = False

    if crowd_status["level"] in ["warning", "critical"]:
        score += 3.0
        escalated = True
        action_plan.append(f"ESCALATION: {zone} is at {crowd_status['level'].upper()} capacity. Rerouting crowds away.")

    if score >= 8.0:
        priority = "Critical"
        if incident_type == "medical":
            action_plan.append("Dispatch onsite medical team immediately (Code Blue)")
        else:
            action_plan.append("Dispatch onsite security immediately (Code Red)")
        action_plan.append(f"Trigger zone {zone} standby PA message")
        action_plan.append("Alert command center supervisors")
    elif score >= 5.0:
        priority = "High"
        action_plan.append("Dispatch rapid response unit immediately")
        action_plan.append("Monitor via CCTV")
    elif score >= 3.0:
        priority = "Moderate"
        action_plan.append("Dispatch nearest steward to investigate")
        action_plan.append("Monitor via CCTV")
    else:
        priority = "Low"
        action_plan.append("Log incident and assign to standard patrol")

    requires_police = incident_type in ["violence", "suspicious_package", "unauthorized_entry"]
    requires_medical = incident_type in ["medical"]

    return {
        "priority_level": priority,
        "action_plan": action_plan,
        "requires_police": requires_police,
        "requires_medical": requires_medical,
        "escalated_due_to_crowd": escalated,
        "crowd_level": crowd_status["level"],
    }
