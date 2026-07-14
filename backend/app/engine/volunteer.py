"""
StadiumIQ Volunteer Engine.

Pure, deterministic, I/O-free functions for volunteer staff allocation.
No network calls or side effects — safe to call from tests without mocking.
"""
from __future__ import annotations

from typing import TypedDict

# Risk level priority weights (higher = more urgent)
_RISK_PRIORITY: dict[str, int] = {
    "CRITICAL": 4,
    "WARNING": 3,
    "MODERATE": 2,
    "SAFE": 1,
}

# Base staff ratio: 1 volunteer per N capacity, per risk level
_RISK_RATIOS: dict[str, int] = {
    "CRITICAL": 100,
    "WARNING": 250,
    "MODERATE": 350,
    "SAFE": 500,
}


class Zone(TypedDict):
    """Input zone dict expected by allocate_volunteers and estimate_required_staff."""
    id: str
    capacity: int
    risk_level: str


class Relocation(TypedDict):
    """Volunteer relocation suggestion."""
    from_zone: str
    to_zone: str
    count: int


class _SpareZone(TypedDict):
    id: str
    spare: int


def estimate_required_staff(zone_capacity: int, risk_level: str) -> int:
    """Estimate volunteers required for a zone given its capacity and risk level.

    Args:
        zone_capacity: Total capacity of the zone (number of people).
        risk_level: One of "CRITICAL", "WARNING", "MODERATE", "SAFE".

    Returns:
        Estimated minimum number of volunteers needed (at least 1).
    """
    ratio = _RISK_RATIOS.get(risk_level.upper(), _RISK_RATIOS["SAFE"])
    return max(1, zone_capacity // ratio)


def allocate_volunteers(zones: list[Zone], available_staff: int) -> dict[str, int]:
    """Distribute available staff across zones, prioritising higher-risk areas.

    Args:
        zones: List of Zone dicts, each with "id" (str), "capacity" (int),
               and "risk_level" (str).
        available_staff: Total number of volunteers to distribute.

    Returns:
        Dict mapping zone_id -> allocated staff count.
    """
    if not zones or available_staff <= 0:
        return {z["id"]: 0 for z in zones}

    # Calculate minimum required per zone
    requirements: dict[str, int] = {}
    for zone in zones:
        requirements[zone["id"]] = estimate_required_staff(zone["capacity"], zone["risk_level"])

    total_required = sum(requirements.values())
    allocations: dict[str, int] = {}

    if available_staff >= total_required:
        # Enough staff — allocate required amounts exactly
        allocations = dict(requirements)
    else:
        # Short-staffed — pro-rata allocation weighted by requirement
        for zone_id, req in requirements.items():
            allocations[zone_id] = int((req / total_required) * available_staff)

    # Distribute any remaining staff (from rounding) to highest-risk zones first
    allocated = sum(allocations.values())
    remaining = available_staff - allocated
    if remaining > 0:
        sorted_zones = sorted(
            zones,
            key=lambda z: _RISK_PRIORITY.get(z["risk_level"].upper(), 1),
            reverse=True,
        )
        for i in range(remaining):
            zone_id = sorted_zones[i % len(sorted_zones)]["id"]
            allocations[zone_id] = allocations.get(zone_id, 0) + 1

    return allocations


def suggest_relocation(
    current_allocations: dict[str, int],
    updated_risk: dict[str, str],
) -> list[Relocation]:
    """Suggest moving volunteers from safe zones to high-risk zones.

    Args:
        current_allocations: Dict of {zone_id: staff_count}.
        updated_risk: Dict of {zone_id: risk_level}.

    Returns:
        List of Relocation TypedDicts with keys:
        "from_zone" (str), "to_zone" (str), "count" (int).
    """
    # Zones that can spare staff (keep at least 1)
    spare_pool: list[_SpareZone] = []
    for zone_id, risk in updated_risk.items():
        count = current_allocations.get(zone_id, 0)
        if risk.upper() == "SAFE" and count > 1:
            spare_pool.append(_SpareZone(id=zone_id, spare=count - 1))

    # Zones that need more staff, sorted by severity
    needy_zones = [
        {"id": zone_id, "risk": risk}
        for zone_id, risk in updated_risk.items()
        if risk.upper() in ("CRITICAL", "WARNING")
    ]
    needy_zones.sort(
        key=lambda z: _RISK_PRIORITY.get(str(z["risk"]).upper(), 1),
        reverse=True,
    )

    suggestions: list[Relocation] = []
    for target in needy_zones:
        if not spare_pool:
            break
        source = spare_pool[0]
        suggestions.append(Relocation(
            from_zone=source["id"],
            to_zone=target["id"],
            count=1,
        ))
        spare_pool[0]["spare"] -= 1
        if spare_pool[0]["spare"] <= 0:
            spare_pool.pop(0)

    return suggestions
