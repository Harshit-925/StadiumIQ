"""StadiumIQ Domain Engine — shortest path navigation."""

from __future__ import annotations

import heapq
from typing import Any

from app.data.venue_graph import VENUE_GRAPH


def find_route(
    origin: str,
    destination: str,
    accessible_only: bool = False,
) -> dict[str, Any]:
    """Compute the shortest walking route between two venue zones.

    Uses Dijkstra's algorithm over the static venue graph. When
    ``accessible_only`` is set, nodes flagged non-accessible are excluded
    entirely, guaranteeing a step-free path or an honest "no route found".

    Args:
        origin: Zone ID to start from.
        destination: Zone ID to reach.
        accessible_only: If True, only traverse accessible zones.

    Returns:
        Dict with ``path`` (list of zone IDs), ``total_minutes``,
        ``accessible`` (bool — whether every node on the path is
        accessible), and ``steps`` (list of {from, to, minutes} dicts).
        If no route exists, ``path`` is empty and ``total_minutes`` is 0.
    """
    if origin not in VENUE_GRAPH or destination not in VENUE_GRAPH:
        return {"path": [], "total_minutes": 0.0, "accessible": False, "steps": []}

    excluded = (
        {z for z, meta in VENUE_GRAPH.items() if not meta["accessible"]}
        if accessible_only else set()
    )
    if origin in excluded or destination in excluded:
        return {"path": [], "total_minutes": 0.0, "accessible": False, "steps": []}

    # Dijkstra
    dist: dict[str, float] = {origin: 0.0}
    prev: dict[str, str] = {}
    visited: set[str] = set()
    heap = [(0.0, origin)]

    while heap:
        d, node = heapq.heappop(heap)
        if node in visited:
            continue
        visited.add(node)
        if node == destination:
            break
        for neighbor, weight in VENUE_GRAPH[node]["neighbors"]:
            if neighbor in excluded or neighbor in visited:
                continue
            nd = d + float(weight)
            if nd < dist.get(neighbor, float("inf")):
                dist[neighbor] = nd
                prev[neighbor] = node
                heapq.heappush(heap, (nd, neighbor))

    if destination not in dist:
        return {"path": [], "total_minutes": 0.0, "accessible": False, "steps": []}

    # Reconstruct path
    path = [destination]
    while path[-1] != origin:
        path.append(prev[path[-1]])
    path.reverse()

    steps = []
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        minutes = next(w for n, w in VENUE_GRAPH[a]["neighbors"] if n == b)
        steps.append({"from": a, "to": b, "minutes": minutes})

    accessible = all(VENUE_GRAPH[z]["accessible"] for z in path)
    return {
        "path": path, "total_minutes": dist[destination],
        "accessible": accessible, "steps": steps,
    }
