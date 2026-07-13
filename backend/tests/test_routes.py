"""Route-level integration tests for StadiumIQ API.

All external services (auth, AI, Supabase) are mocked via conftest fixtures.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any

import pytest

if TYPE_CHECKING:
    from unittest.mock import MagicMock

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
        assert "supabase" in data
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
            "zone_densities": {"gate_a": 1.5, "concourse_north": 2.0, "bowl_lower": 3.0, "gate_b": 1.0, "gate_c": 2.5, "concourse_south": 1.8, "bowl_upper": 2.2},
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
        mock_supabase: MagicMock,
        valid_payload: dict[str, Any],
    ) -> None:
        """Full pipeline success: engine → AI → save → response."""
        resp = await client.post(
            "/api/analyze",
            json=valid_payload,
            headers={"Authorization": "Bearer test_token"},
        )
        assert resp.status_code == 200, resp.json()
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
        assert "route_recommendation" in data
        assert isinstance(data["crowd_score"], float)
        assert isinstance(data["zone_analyses"], list)

    async def test_analyze_no_auth(
        self, client: AsyncClient, valid_payload: dict[str, Any]
    ) -> None:
        """Missing Authorization header now returns 200 (public endpoint)."""
        resp = await client.post("/api/analyze", json=valid_payload)
        assert resp.status_code == 200

    async def test_analyze_invalid_venue(self, client: AsyncClient, mock_auth: MagicMock) -> None:
        """Invalid venue_id → 422 validation error."""
        payload = {
            "venue_id": "invalid_venue",
            "zone_densities": {"gate_a": 1.0},
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
            "zone_densities": {"gate_a": 15.0},
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

    async def test_unhandled_exception_returns_consistent_shape(
        self, client: AsyncClient, monkeypatch: pytest.MonkeyPatch
    ) -> None:
        """A genuinely unexpected exception should return the standard error
        shape, not leak a stack trace or raw exception text."""
        def _boom(*args: Any, **kwargs: Any) -> None:
            raise RuntimeError("simulated failure")

        monkeypatch.setattr("app.routes.analyze.analyze_venue", _boom)
        response = await client.post(
            "/api/analyze",
            json={
                "venue_id": "metlife",
                "zone_densities": {"gate_a": 1.0},
                "waste_recycled_kg": 100.0,
                "waste_total_kg": 200.0,
                "spectator_count": 10000,
                "risk_level": "low",
            }
        )
        assert response.status_code == 500
        body = response.json()
        assert body["code"] == "internal_error"
        assert "request_id" in body
        assert "RuntimeError" not in response.text  # no leaked exception detail


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


class TestStaticRoutes:
    """Tests for the static file serving and fallback routing."""

    async def test_path_traversal_prevention(self, client: AsyncClient) -> None:
        """Ensure percent-encoded path traversal attempts fall back to index.html."""
        # Attempt to escape static_dir using URL-encoded dot-dots.
        # This simulates `%2e%2e/%2e%2e/etc/passwd`
        payload = "%2e%2e/%2e%2e/etc/passwd"
        resp = await client.get(f"/{payload}")

        # If the vulnerability existed, this would return 404 (file not found locally)
        # or the file contents if it existed.
        # With the fix, any path that resolves outside the static_dir falls through
        # to the React Router catch-all (which returns index.html, giving a 200).
        # However, if frontend/dist doesn't exist (like in backend-only CI jobs),
        # the route isn't registered and returns 404. Both are safe.
        assert resp.status_code in (200, 404)
        assert "root:x:" not in resp.text
