"""Route-level integration tests for StadiumIQ API.

All external services (auth, AI, PocketBase) are mocked via conftest fixtures.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from unittest.mock import MagicMock

import pytest

if TYPE_CHECKING:
    from httpx import AsyncClient

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  HEALTH                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestHealthEndpoint:
    """Tests for GET /api/health."""

    async def test_health_returns_200(self, client: AsyncClient) -> None:
        """Health endpoint returns 200 with status and version."""
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "pocketbase" in data
        assert "version" in data

    async def test_health_no_auth_required(self, client: AsyncClient) -> None:
        """Health endpoint does NOT require authentication."""
        resp = await client.get("/api/health")
        # Should not be 401 or 422
        assert resp.status_code == 200


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  ANALYZE                                                               ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestAnalyzeEndpoint:
    """Tests for POST /api/analyze."""

    @pytest.fixture()
    def valid_payload(self) -> dict[str, Any]:
        """Standard valid request body."""
        return {
            "venue_id": "metlife",
            "zone_densities": [1.5, 2.0, 3.0, 1.0, 2.5, 1.8, 2.2, 1.3],
            "waste_recycled_kg": 800.0,
            "waste_total_kg": 1000.0,
            "spectator_count": 70000,
            "risk_level": "low",
        }

    async def test_analyze_success(
        self,
        client: AsyncClient,
        mock_auth: MagicMock,
        mock_genai: MagicMock,
        mock_pocketbase: MagicMock,
        valid_payload: dict[str, Any],
    ) -> None:
        """Full pipeline success: engine → AI → save → response."""
        resp = await client.post(
            "/api/analyze",
            json=valid_payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 200
        data = resp.json()
        # Flat response shape — matches frontend VenueAnalysisResponse type
        assert "venue" in data
        assert "overall_grade" in data
        assert "crowd_score" in data
        assert "zone_analyses" in data
        assert "evacuation_time_minutes" in data
        assert "evacuation_feasible" in data
        assert "accessibility_compliance" in data
        assert "wheelchair_ratio" in data
        assert "sustainability_score" in data
        assert "recycling_rate" in data
        assert "ai_insights" in data
        assert "ai_fallback" in data
        assert isinstance(data["crowd_score"], float)
        assert isinstance(data["zone_analyses"], list)

    async def test_analyze_no_auth(
        self, client: AsyncClient, valid_payload: dict[str, Any]
    ) -> None:
        """Missing Authorization header → 422 (FastAPI validation) or 401."""
        resp = await client.post("/api/analyze", json=valid_payload)
        assert resp.status_code in (401, 422)

    async def test_analyze_invalid_venue(self, client: AsyncClient, mock_auth: MagicMock) -> None:
        """Invalid venue_id → 422 validation error."""
        payload = {
            "venue_id": "invalid_venue",
            "zone_densities": [1.0],
            "waste_recycled_kg": 100.0,
            "waste_total_kg": 200.0,
            "spectator_count": 10000,
            "risk_level": "low",
        }
        resp = await client.post(
            "/api/analyze",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 422

    async def test_analyze_invalid_density_range(
        self, client: AsyncClient, mock_auth: MagicMock
    ) -> None:
        """Density > 10 → 422 validation error."""
        payload = {
            "venue_id": "metlife",
            "zone_densities": [15.0],
            "waste_recycled_kg": 100.0,
            "waste_total_kg": 200.0,
            "spectator_count": 10000,
            "risk_level": "low",
        }
        resp = await client.post(
            "/api/analyze",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 422

    async def test_analyze_missing_fields(self, client: AsyncClient, mock_auth: MagicMock) -> None:
        """Missing required fields → 422."""
        resp = await client.post(
            "/api/analyze",
            json={"venue_id": "metlife"},
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 422


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FAN ASSIST                                                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestFanAssistEndpoint:
    """Tests for POST /api/fan-assist."""

    async def test_fan_assist_success(
        self,
        client: AsyncClient,
        mock_auth: MagicMock,
        mock_genai: MagicMock,
    ) -> None:
        """Successful fan-assist request returns response text."""
        payload = {
            "query": "What time do gates open?",
            "language": "en",
        }
        resp = await client.post(
            "/api/fan-assist",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data
        assert "language" in data
        assert data["language"] == "en"
        assert "source" in data

    async def test_fan_assist_with_venue(
        self,
        client: AsyncClient,
        mock_auth: MagicMock,
        mock_genai: MagicMock,
    ) -> None:
        """Fan-assist with venue context succeeds."""
        payload = {
            "query": "How do I get to the stadium?",
            "language": "es",
            "venue_id": "azteca",
        }
        resp = await client.post(
            "/api/fan-assist",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 200
        assert resp.json()["language"] == "es"

    async def test_fan_assist_no_auth(self, client: AsyncClient, mock_genai: MagicMock) -> None:
        """Fan-assist is a PUBLIC endpoint — no auth required.

        Unauthenticated callers must receive 200 (not 401/422). This is the
        contract required by the public /assistant fan-facing route.
        """
        payload = {"query": "Hello", "language": "en"}
        resp = await client.post("/api/fan-assist", json=payload)
        assert resp.status_code == 200
        data = resp.json()
        assert "response" in data

    async def test_fan_assist_empty_query(self, client: AsyncClient, mock_auth: MagicMock) -> None:
        """Empty query → 422 validation error."""
        payload = {"query": "", "language": "en"}
        resp = await client.post(
            "/api/fan-assist",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 422

    async def test_fan_assist_query_too_long(
        self, client: AsyncClient, mock_auth: MagicMock
    ) -> None:
        """Query exceeding 500 chars → 422."""
        payload = {"query": "x" * 501, "language": "en"}
        resp = await client.post(
            "/api/fan-assist",
            json=payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 422
