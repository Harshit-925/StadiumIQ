from __future__ import annotations

from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from unittest.mock import MagicMock
    from httpx import AsyncClient


class TestNavigateEndpoint:
    """Tests for POST /api/navigate."""

    async def test_navigate_success(self, client: AsyncClient, mock_genai: MagicMock) -> None:
        resp = await client.post("/api/navigate", json={
            "origin": "gate_a",
            "destination": "concourse_north",
            "accessible_only": False,
            "language": "en"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "steps" in data
        assert "narrative" in data
        assert "total_minutes" in data

    async def test_navigate_not_found(self, client: AsyncClient) -> None:
        resp = await client.post("/api/navigate", json={
            "origin": "gate_a",
            "destination": "invalid_zone",
            "accessible_only": False
        })
        assert resp.status_code == 404


class TestTransportEndpoint:
    """Tests for POST /api/transport."""

    async def test_transport_success(self, client: AsyncClient) -> None:
        resp = await client.post("/api/transport", json={
            "accessible_only": False
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "parking" in data
        assert "transit" in data


class TestEmergencyEndpoint:
    """Tests for POST /api/emergency."""

    async def test_emergency_success(self, client: AsyncClient, mock_genai: MagicMock) -> None:
        resp = await client.post("/api/emergency", json={
            "incident_type": "medical",
            "severity": 3,
            "zone": "gate_a"
        })
        assert resp.status_code == 200
        data = resp.json()
        assert "priority_level" in data
        assert "ai_brief" in data
        assert "action_plan" in data
