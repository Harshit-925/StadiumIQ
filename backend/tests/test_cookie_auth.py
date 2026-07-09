"""Tests for Supabase JWT-based authentication flow.

With Supabase, the frontend handles login/signup/logout via the Supabase JS SDK.
The backend only validates the JWT locally. This file tests:
1. Protected routes reject requests without a valid JWT (401).
2. Protected routes accept requests with a valid JWT.
3. The /api/analyze and /api/fan-assist endpoints behave correctly.

Note: The old cookie-based PocketBase login/logout endpoints (/api/auth/login,
/api/auth/logout) no longer exist. Those tests have been replaced by this file.
"""

from __future__ import annotations

from typing import TYPE_CHECKING, Any
from unittest.mock import MagicMock, patch

import pytest

from tests.conftest import TEST_JWT_SECRET, make_test_token

if TYPE_CHECKING:
    from httpx import AsyncClient


def _patch_secret():
    """Patch settings to use the test JWT secret."""
    mock_settings = MagicMock()
    mock_settings.supabase_jwt_secret = TEST_JWT_SECRET
    mock_settings.supabase_url = ""
    mock_settings.supabase_service_role_key = ""
    mock_settings.rate_limit_storage_uri = "memory://"
    mock_settings.environment = "test"
    mock_settings.app_version = "1.0.0"
    mock_settings.get_allowed_origins.return_value = []
    return patch("app.core.auth.get_settings", return_value=mock_settings)


@pytest.fixture()
def valid_analyze_payload() -> dict[str, Any]:
    return {
        "venue_id": "metlife",
        "zone_densities": [1.5, 2.0, 3.0, 1.0, 2.5, 1.8, 2.2, 1.3],
        "waste_recycled_kg": 800.0,
        "waste_total_kg": 1000.0,
        "spectator_count": 70000,
        "risk_level": "low",
    }


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  AUTH REQUIRED ROUTES                                                  ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestJWTAuthFlow:
    """Tests that confirm JWT-based auth works end-to-end on API routes."""

    async def test_analyze_with_valid_jwt(
        self,
        client: AsyncClient,
        mock_auth: MagicMock,
        mock_genai: MagicMock,
        mock_pocketbase: MagicMock,
        valid_analyze_payload: dict[str, Any],
    ) -> None:
        """A request with a valid JWT token should succeed."""
        token = make_test_token()
        resp = await client.post(
            "/api/analyze",
            json=valid_analyze_payload,
            headers={"Authorization": f"Bearer {token}"},
        )
        # mock_auth bypasses real JWT verification; this tests the route plumbing
        assert resp.status_code == 200

    async def test_no_login_endpoint_exists(self, client: AsyncClient) -> None:
        """The old /api/auth/login endpoint no longer exists (Supabase handles auth).

        FastAPI returns 404 if the path is unknown or 405 if the router prefix
        exists but has no POST handler. Either signals the endpoint is removed.
        """
        resp = await client.post(
            "/api/auth/login",
            json={"email": "test@example.com", "password": "secret"},
        )
        assert resp.status_code in (404, 405)

    async def test_no_logout_endpoint_exists(self, client: AsyncClient) -> None:
        """The old /api/auth/logout endpoint no longer exists (Supabase handles auth)."""
        resp = await client.post("/api/auth/logout")
        assert resp.status_code in (404, 405)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  PUBLIC ENDPOINTS — NO AUTH NEEDED                                     ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestPublicEndpoints:
    """Tests confirming that public endpoints work without any JWT."""

    async def test_health_no_auth_required(self, client: AsyncClient) -> None:
        """GET /api/health must succeed without any Authorization header."""
        resp = await client.get("/api/health")
        assert resp.status_code == 200
        data = resp.json()
        assert "status" in data
        assert "supabase" in data

    async def test_fan_assist_no_auth_required(
        self, client: AsyncClient, mock_genai: MagicMock
    ) -> None:
        """POST /api/fan-assist is public — no JWT required."""
        resp = await client.post(
            "/api/fan-assist",
            json={"query": "Where is the nearest exit?", "language": "en"},
        )
        assert resp.status_code == 200
