"""Static in-venue wayfinding graph.

Models a generic FIFA World Cup 2026 stadium layout: gates, concourses,
sections, and key amenities, connected by walk-time-weighted edges. This
is a floor-plan model, not live sensor data — same honesty standard as
the rest of the domain engine.
"""
from __future__ import annotations

from typing import Any

# node_id -> {"name": str, "accessible": bool, "neighbors": [(node_id, minutes), ...]}
VENUE_GRAPH: dict[str, dict[str, Any]] = {
    "gate_a": {"name": "Gate A", "accessible": True,
               "neighbors": [("concourse_north", 2)]},
    "gate_b": {"name": "Gate B", "accessible": True,
               "neighbors": [("concourse_east", 2)]},
    "gate_c": {"name": "Gate C", "accessible": False,  # stairs only
               "neighbors": [("concourse_west", 2)]},
    "concourse_north": {"name": "North Concourse", "accessible": True,
        "neighbors": [("gate_a", 2), ("section_lower_bowl", 3),
                      ("concourse_east", 4), ("concourse_west", 4)]},
    "concourse_east": {"name": "East Concourse", "accessible": True,
        "neighbors": [("gate_b", 2), ("section_upper_bowl", 4),
                      ("family_zone", 2), ("concourse_north", 4),
                      ("concourse_south", 4)]},
    "concourse_west": {"name": "West Concourse", "accessible": False,
        "neighbors": [("gate_c", 2), ("press_zone", 2),
                      ("concourse_north", 4), ("concourse_south", 4)]},
    "concourse_south": {"name": "South Concourse", "accessible": True,
        "neighbors": [("accessible_seating", 1), ("medical_station", 1),
                      ("concourse_east", 4), ("concourse_west", 4)]},
    "section_lower_bowl": {"name": "Lower Bowl", "accessible": True,
                            "neighbors": [("concourse_north", 3)]},
    "section_upper_bowl": {"name": "Upper Bowl", "accessible": False,
                            "neighbors": [("concourse_east", 4)]},
    "family_zone": {"name": "Family Zone", "accessible": True,
                     "neighbors": [("concourse_east", 2)]},
    "press_zone": {"name": "Press Zone", "accessible": True,
                    "neighbors": [("concourse_west", 2)]},
    "accessible_seating": {"name": "Accessible Seating", "accessible": True,
                            "neighbors": [("concourse_south", 1)]},
    "medical_station": {"name": "Medical Station", "accessible": True,
                         "neighbors": [("concourse_south", 1)]},
}

def is_valid_zone(zone_id: str) -> bool:
    return zone_id in VENUE_GRAPH

def zone_display_name(zone_id: str) -> str:
    return VENUE_GRAPH.get(zone_id, {}).get("name", zone_id) # type: ignore
