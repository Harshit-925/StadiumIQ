"""StadiumIQ Domain Engine — transportation logic."""

from __future__ import annotations

from typing import Any

from app.data.transit import PARKING_DATA, TRANSIT_DATA


def get_transport_options(accessible_only: bool = False) -> dict[str, Any]:
    """Retrieve and rank current transportation options.

    Filters and sorts parking lots and transit lines deterministically.
    Full parking lots and delayed/suspended transit options sink to the
    bottom of the recommendation list.

    Args:
        accessible_only: If True, only returns accessible options.

    Returns:
        Dict with ranked 'parking' and 'transit' lists.
    """
    parking = []
    for lot_id, data in PARKING_DATA.items():
        if accessible_only and data["accessible_spaces"] == 0:
            continue

        score = 0
        if data["status"] == "Full" or data["occupancy_pct"] >= 95:
            score += 100  # Penalty sinks it
        score += data["walk_time_mins"]

        parking.append({
            "id": lot_id,
            "rank_score": score,
            **data
        })

    transit = []
    for transit_id, data in TRANSIT_DATA.items():
        if accessible_only and not data["accessible"]:
            continue

        score = 0
        if data["status"] != "Running":
            score += 100
        if data["crowd_level"] == "High":
            score += 20
        elif data["crowd_level"] == "Medium":
            score += 10

        transit.append({
            "id": transit_id,
            "rank_score": score,
            **data
        })

    # Sort by rank_score (lower is better)
    parking.sort(key=lambda x: x["rank_score"])
    transit.sort(key=lambda x: x["rank_score"])

    # Remove rank_score from final output
    for p in parking:
        p.pop("rank_score")
    for t in transit:
        t.pop("rank_score")

    return {
        "parking": parking,
        "transit": transit,
    }
