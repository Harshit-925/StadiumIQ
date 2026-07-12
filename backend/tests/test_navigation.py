"""Tests for shortest path routing logic."""

from __future__ import annotations

from app.data.venue_graph import VENUE_GRAPH
from app.engine.navigation import find_route


class TestFindRoute:
    def test_shortest_path(self) -> None:
        """Finds known shortest path between two zones."""
        # gate_a -> concourse_north -> section_lower_bowl
        result = find_route("gate_a", "section_lower_bowl")
        assert result["path"] == ["gate_a", "concourse_north", "section_lower_bowl"]
        assert result["total_minutes"] == 5.0
        assert result["accessible"] is True
        assert len(result["steps"]) == 2

    def test_accessible_routing(self) -> None:
        """Accessible-only routing avoids non-accessible nodes."""
        # gate_c and concourse_west are not accessible.
        # So gate_a -> gate_c should return no route if accessible_only=True
        result = find_route("gate_a", "gate_c", accessible_only=True)
        assert result["path"] == []
        assert result["total_minutes"] == 0.0

    def test_unreachable_zone(self) -> None:
        """Unreachable/invalid zone returns empty path."""
        result = find_route("gate_a", "invalid_zone")
        assert result["path"] == []

    def test_graph_symmetry(self) -> None:
        """The static venue graph must be completely symmetrical."""
        for node, meta in VENUE_GRAPH.items():
            for neighbor, weight in meta["neighbors"]:
                assert neighbor in VENUE_GRAPH, f"Node {node} points to non-existent neighbor {neighbor}"
                # Assert neighbor points back with same weight
                back_edges = VENUE_GRAPH[neighbor]["neighbors"]
                match = [w for n, w in back_edges if n == node]
                assert len(match) == 1, f"Missing symmetrical edge from {neighbor} back to {node}"
                assert match[0] == weight, f"Asymmetrical weight between {node} and {neighbor}"
