"""StadiumIQ Domain Engine — emergency and incident triage."""

from __future__ import annotations

from typing import Any


def triage_incident(incident_type: str, severity: int, zone: str) -> dict[str, Any]:
    """Deterministic routing for incidents.

    Assigns priority level and generates an action plan based on standard
    event management triage protocols.

    Args:
        incident_type: The type of incident (e.g. 'medical', 'violence').
        severity: Scale 1-5 (1=lowest, 5=highest).
        zone: The zone ID where the incident occurred.

    Returns:
        Dict containing triage details and action plan.
    """
    action_plan = []

    if severity >= 4:
        if incident_type == "medical":
            action_plan.append("Dispatch onsite medical team immediately (Code Blue)")
        else:
            action_plan.append("Dispatch onsite security immediately (Code Red)")
        action_plan.append(f"Trigger zone {zone} standby PA message")
        action_plan.append("Alert command center supervisors")
    elif severity == 3:
        action_plan.append("Dispatch nearest steward or rapid response unit")
        action_plan.append("Monitor via CCTV")
    else:
        action_plan.append("Dispatch nearest steward to investigate")

    requires_police = incident_type in ["violence", "suspicious_package", "unauthorized_entry"]
    requires_medical = incident_type in ["medical"]

    return {
        "priority_level": "Critical" if severity >= 4 else "Moderate" if severity == 3 else "Low",
        "action_plan": action_plan,
        "requires_police": requires_police,
        "requires_medical": requires_medical,
    }
