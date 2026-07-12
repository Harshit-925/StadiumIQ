"""Static reference data for transportation modules.

Models parking lots, transit lines, and shuttle services with static capacity,
occupancy, and accessibility data. Serves as a deterministic reference for the
Transport engine, similar to how VENUE_GRAPH functions for Navigation.
"""

from __future__ import annotations

from typing import Any

PARKING_DATA: dict[str, dict[str, Any]] = {
    "lot_a": {
        "name": "North Premium Lot",
        "capacity": 1500,
        "occupancy_pct": 98,
        "walk_time_mins": 5,
        "accessible_spaces": 150,
        "status": "Full",
    },
    "lot_b": {
        "name": "East General Lot",
        "capacity": 3000,
        "occupancy_pct": 82,
        "walk_time_mins": 12,
        "accessible_spaces": 50,
        "status": "Open",
    },
    "lot_c": {
        "name": "South Overflow Lot",
        "capacity": 2500,
        "occupancy_pct": 45,
        "walk_time_mins": 18,
        "accessible_spaces": 0,
        "status": "Open",
    },
}

TRANSIT_DATA: dict[str, dict[str, Any]] = {
    "shuttle_1": {
        "name": "Downtown Express Shuttle",
        "type": "Shuttle",
        "frequency_mins": 10,
        "crowd_level": "High",
        "accessible": True,
        "status": "Running",
    },
    "metro_red": {
        "name": "Red Line Metro",
        "type": "Train",
        "frequency_mins": 15,
        "crowd_level": "Medium",
        "accessible": True,
        "status": "Delayed",
    },
    "shuttle_2": {
        "name": "Airport Direct Shuttle",
        "type": "Shuttle",
        "frequency_mins": 20,
        "crowd_level": "Low",
        "accessible": False,
        "status": "Running",
    },
}
