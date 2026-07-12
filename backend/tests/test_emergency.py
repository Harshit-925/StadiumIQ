"""Tests for emergency triage logic."""

from __future__ import annotations

from app.engine.emergency import triage_incident


class TestEmergencyTriage:
    def test_critical_medical_incident(self) -> None:
        result = triage_incident("medical", 5, "gate_a")
        assert result["priority_level"] == "Critical"
        assert result["requires_medical"] is True
        assert result["requires_police"] is False
        assert any("Code Blue" in step for step in result["action_plan"])

    def test_critical_security_incident(self) -> None:
        result = triage_incident("violence", 4, "concourse_north")
        assert result["priority_level"] == "Critical"
        assert result["requires_medical"] is False
        assert result["requires_police"] is True
        assert any("Code Red" in step for step in result["action_plan"])

    def test_moderate_incident(self) -> None:
        result = triage_incident("spill", 3, "section_upper_bowl")
        assert result["priority_level"] == "Moderate"
        assert result["requires_medical"] is False
        assert result["requires_police"] is False
        assert any("nearest steward or rapid response unit" in step for step in result["action_plan"])

    def test_low_level_incident(self) -> None:
        result = triage_incident("suspicious_package", 2, "gate_b")
        assert result["priority_level"] == "Low"
        assert result["requires_police"] is True
        assert any("nearest steward to investigate" in step for step in result["action_plan"])
