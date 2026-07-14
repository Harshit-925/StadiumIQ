"""Tests for app/engine/volunteer.py — deterministic, no I/O."""

from __future__ import annotations

from app.engine.volunteer import (
    Zone,
    allocate_volunteers,
    estimate_required_staff,
    suggest_relocation,
)


class TestEstimateRequiredStaff:
    def test_critical_zone_high_ratio(self) -> None:
        assert estimate_required_staff(1000, "CRITICAL") == 10  # 1000 // 100

    def test_warning_zone(self) -> None:
        assert estimate_required_staff(1000, "WARNING") == 4  # 1000 // 250

    def test_moderate_zone(self) -> None:
        assert estimate_required_staff(1000, "MODERATE") == 2  # 1000 // 350 (floor)

    def test_safe_zone(self) -> None:
        assert estimate_required_staff(1000, "SAFE") == 2  # 1000 // 500

    def test_minimum_one_volunteer(self) -> None:
        # Small zone should still get at least 1
        assert estimate_required_staff(50, "SAFE") == 1

    def test_zero_capacity_returns_one(self) -> None:
        # 0 // anything = 0, but max(1, ...) returns 1
        assert estimate_required_staff(0, "CRITICAL") == 1

    def test_case_insensitive_risk(self) -> None:
        assert estimate_required_staff(1000, "critical") == estimate_required_staff(1000, "CRITICAL")

    def test_unknown_risk_defaults_to_safe(self) -> None:
        assert estimate_required_staff(1000, "UNKNOWN") == estimate_required_staff(1000, "SAFE")


class TestAllocateVolunteers:
    def test_enough_staff_allocates_requirements(self) -> None:
        zones: list[Zone] = [
            Zone(id="north", capacity=1000, risk_level="CRITICAL"),  # needs 10
            Zone(id="south", capacity=1000, risk_level="SAFE"),       # needs 2
        ]
        result = allocate_volunteers(zones, available_staff=100)
        # Both zones get at least their minimum requirement
        assert result["north"] >= 10
        assert result["south"] >= 2
        # All 100 staff are distributed
        assert sum(result.values()) == 100

    def test_pro_rata_when_short_staffed(self) -> None:
        zones: list[Zone] = [
            Zone(id="a", capacity=1000, risk_level="CRITICAL"),  # needs 10
            Zone(id="b", capacity=1000, risk_level="CRITICAL"),  # needs 10
        ]
        result = allocate_volunteers(zones, available_staff=10)
        # Each gets ~5
        assert result["a"] + result["b"] == 10

    def test_zero_staff_returns_zeros(self) -> None:
        zones: list[Zone] = [Zone(id="a", capacity=1000, risk_level="SAFE")]
        result = allocate_volunteers(zones, available_staff=0)
        assert result == {"a": 0}

    def test_empty_zones_returns_empty(self) -> None:
        result = allocate_volunteers([], available_staff=50)
        assert result == {}

    def test_all_zones_covered(self) -> None:
        zones: list[Zone] = [
            Zone(id="z1", capacity=500, risk_level="MODERATE"),
            Zone(id="z2", capacity=800, risk_level="WARNING"),
            Zone(id="z3", capacity=200, risk_level="CRITICAL"),
        ]
        result = allocate_volunteers(zones, available_staff=20)
        assert set(result.keys()) == {"z1", "z2", "z3"}
        assert all(v >= 0 for v in result.values())

    def test_total_allocation_does_not_exceed_available(self) -> None:
        zones: list[Zone] = [
            Zone(id=f"z{i}", capacity=1000, risk_level="CRITICAL")
            for i in range(10)
        ]
        result = allocate_volunteers(zones, available_staff=75)
        assert sum(result.values()) <= 75


class TestSuggestRelocation:
    def test_suggests_moving_from_safe_to_critical(self) -> None:
        allocations = {"safe_zone": 5, "critical_zone": 2}
        updated_risk = {"safe_zone": "SAFE", "critical_zone": "CRITICAL"}
        suggestions = suggest_relocation(allocations, updated_risk)
        assert len(suggestions) == 1
        assert suggestions[0]["from_zone"] == "safe_zone"
        assert suggestions[0]["to_zone"] == "critical_zone"
        assert suggestions[0]["count"] > 0

    def test_no_suggestions_when_all_safe(self) -> None:
        allocations = {"a": 3, "b": 4}
        updated_risk = {"a": "SAFE", "b": "SAFE"}
        assert suggest_relocation(allocations, updated_risk) == []

    def test_no_suggestions_when_safe_zone_has_only_one(self) -> None:
        # Can't spare anyone if the safe zone only has 1 volunteer
        allocations = {"safe_zone": 1, "critical_zone": 2}
        updated_risk = {"safe_zone": "SAFE", "critical_zone": "CRITICAL"}
        assert len(suggest_relocation(allocations, updated_risk)) == 0

    def test_critical_prioritised_over_warning(self) -> None:
        allocations = {"safe": 5, "warning": 2, "critical": 2}
        updated_risk = {"safe": "SAFE", "warning": "WARNING", "critical": "CRITICAL"}
        suggestions = suggest_relocation(allocations, updated_risk)
        # First suggestion should target CRITICAL
        assert suggestions[0]["to_zone"] == "critical"

    def test_empty_inputs_return_empty(self) -> None:
        assert suggest_relocation({}, {}) == []
