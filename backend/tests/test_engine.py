"""Exhaustive tests for the StadiumIQ domain engine orchestrator.

Tests every public function with exact boundary assertions.  No external
services are touched — these are pure-function unit tests.
"""

from __future__ import annotations

import pytest

from app.engine.calculator import (
    VENUES,
    analyze_venue,
    get_venue_info,
)


class TestGetVenueInfo:
    """Tests for venue lookup."""

    def test_valid_venue(self) -> None:
        """Looking up 'metlife' returns correct data."""
        venue = get_venue_info("metlife")
        assert venue["name"] == "MetLife Stadium"
        assert venue["capacity"] == 82500
        assert venue["venue_id"] == "metlife"

    def test_case_insensitive(self) -> None:
        """Venue lookup should be case-insensitive."""
        venue = get_venue_info("MetLife")
        assert venue["name"] == "MetLife Stadium"

    def test_invalid_venue_raises(self) -> None:
        """Unknown venue → ValueError."""
        with pytest.raises(ValueError, match="Unknown venue"):
            get_venue_info("nonexistent")

    def test_all_venues_exist(self) -> None:
        """All 16 venues must exist with required fields."""
        required_fields = {"name", "city", "country", "capacity", "exit_width_m", "wheelchair_seats"}
        assert len(VENUES) == 16
        for vid, vdata in VENUES.items():
            for field in required_fields:
                assert field in vdata, f"Venue '{vid}' missing field '{field}'"

    def test_all_venues_retrievable(self) -> None:
        """Every venue in VENUES can be retrieved by get_venue_info."""
        for vid in VENUES:
            info = get_venue_info(vid)
            assert info["venue_id"] == vid


class TestAnalyzeVenue:
    """Tests for the master analysis function."""

    def test_full_analysis_structure(self) -> None:
        """analyze_venue returns all expected top-level keys."""
        result = analyze_venue(
            venue_id="sofi",
            zone_densities={"gate_a": 1.0, "concourse_north": 2.0, "gate_b": 3.0},
            waste_recycled_kg=500.0,
            waste_total_kg=1000.0,
        )

        assert "venue" in result
        assert "zone_analyses" in result
        assert "evacuation" in result
        assert "accessibility" in result
        assert "waste_diversion" in result
        assert "readiness" in result
        assert "route_recommendation" in result

    def test_zone_count_matches(self) -> None:
        """The number of zone_analyses should match the input dict length."""
        densities = {"gate_a": 1.5, "gate_b": 1.5, "gate_c": 1.5, "gate_d": 1.5, "gate_e": 1.5}
        result = analyze_venue("azteca", densities, 100.0, 200.0)
        assert len(result["zone_analyses"]) == len(densities)

    def test_invalid_venue_raises(self) -> None:
        """Invalid venue → ValueError."""
        with pytest.raises(ValueError):
            analyze_venue("fake_venue", {"a": 1.0}, 100.0, 200.0)
