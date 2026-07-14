"""StadiumIQ Domain Engine — shortest path navigation."""

from __future__ import annotations

import heapq
from typing import Any

from app.data.venue_graph import VENUE_GRAPH


def _get_excluded_zones(accessible_only: bool) -> set[str]:
    """Return a set of zone IDs to exclude based on accessibility."""
    if not accessible_only:
        return set()
    return {z for z, meta in VENUE_GRAPH.items() if not meta["accessible"]}


def _run_dijkstra(origin: str, destination: str, excluded: set[str]) -> tuple[dict[str, float], dict[str, str]]:
    """Run Dijkstra's algorithm to find the shortest path."""
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

    return dist, prev


def _reconstruct_path(origin: str, destination: str, prev: dict[str, str]) -> tuple[list[str], list[dict[str, Any]]]:
    """Reconstruct the path and step instructions from the previous node map."""
    path = [destination]
    while path[-1] != origin:
        path.append(prev[path[-1]])
    path.reverse()

    steps = []
    for i in range(len(path) - 1):
        a, b = path[i], path[i + 1]
        minutes = next(w for n, w in VENUE_GRAPH[a]["neighbors"] if n == b)
        steps.append({"from": a, "to": b, "minutes": minutes})

    return path, steps


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
    empty_result: dict[str, Any] = {"path": [], "total_minutes": 0.0, "accessible": False, "steps": []}

    if origin not in VENUE_GRAPH or destination not in VENUE_GRAPH:
        return empty_result

    excluded = _get_excluded_zones(accessible_only)
    if origin in excluded or destination in excluded:
        return empty_result

    dist, prev = _run_dijkstra(origin, destination, excluded)

    if destination not in dist:
        return empty_result

    path, steps = _reconstruct_path(origin, destination, prev)
    accessible = all(VENUE_GRAPH[z]["accessible"] for z in path)

    return {
        "path": path,
        "total_minutes": dist[destination],
        "accessible": accessible,
        "steps": steps,
    }
