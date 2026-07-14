"""Tests for app/routes/health.py — covering all Supabase connectivity branches."""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from httpx import AsyncClient


@pytest.mark.anyio
async def test_health_when_supabase_not_configured(client: AsyncClient) -> None:
    """When SUPABASE_URL is not set, health should report not_configured and healthy."""
    with patch("app.routes.health.get_settings") as mock_settings:
        settings = MagicMock()
        settings.supabase_url = ""
        settings.app_version = "test-1.0"
        mock_settings.return_value = settings

        response = await client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "healthy"
    assert body["supabase"] == "not_configured"
    assert body["version"] == "test-1.0"


@pytest.mark.anyio
async def test_health_when_supabase_reachable_200(client: AsyncClient) -> None:
    """When Supabase returns 200, health.supabase should be 'healthy'."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200

    with patch("app.routes.health.get_settings") as mock_settings, \
         patch("app.routes.health.httpx.AsyncClient") as mock_httpx:
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_service_role_key = "fake-key"
        settings.app_version = "1.0.0"
        mock_settings.return_value = settings

        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_resp
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx.return_value = mock_instance

        response = await client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["supabase"] == "healthy"
    assert body["status"] == "healthy"


@pytest.mark.anyio
async def test_health_when_supabase_reachable_400(client: AsyncClient) -> None:
    """Supabase returning 400 (valid REST ping, no table specified) should be 'healthy'."""
    mock_resp = MagicMock()
    mock_resp.status_code = 400

    with patch("app.routes.health.get_settings") as mock_settings, \
         patch("app.routes.health.httpx.AsyncClient") as mock_httpx:
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_service_role_key = "fake-key"
        settings.app_version = "1.0.0"
        mock_settings.return_value = settings

        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_resp
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx.return_value = mock_instance

        response = await client.get("/api/health")

    assert response.status_code == 200
    assert response.json()["supabase"] == "healthy"


@pytest.mark.anyio
async def test_health_when_supabase_unhealthy(client: AsyncClient) -> None:
    """Supabase returning a non-200/400 status should mark it as 'unhealthy'."""
    mock_resp = MagicMock()
    mock_resp.status_code = 503

    with patch("app.routes.health.get_settings") as mock_settings, \
         patch("app.routes.health.httpx.AsyncClient") as mock_httpx:
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_service_role_key = "fake-key"
        settings.app_version = "1.0.0"
        mock_settings.return_value = settings

        mock_instance = AsyncMock()
        mock_instance.get.return_value = mock_resp
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx.return_value = mock_instance

        response = await client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["supabase"] == "unhealthy"
    assert body["status"] == "degraded"


@pytest.mark.anyio
async def test_health_when_supabase_unreachable(client: AsyncClient) -> None:
    """When Supabase throws an HTTPError, health should report 'unreachable'."""
    with patch("app.routes.health.get_settings") as mock_settings, \
         patch("app.routes.health.httpx.AsyncClient") as mock_httpx:
        settings = MagicMock()
        settings.supabase_url = "https://fake.supabase.co"
        settings.supabase_service_role_key = "fake-key"
        settings.app_version = "1.0.0"
        mock_settings.return_value = settings

        mock_instance = AsyncMock()
        mock_instance.get.side_effect = httpx.ConnectError("Connection refused")
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_httpx.return_value = mock_instance

        response = await client.get("/api/health")

    assert response.status_code == 200
    body = response.json()
    assert body["supabase"] == "unreachable"
    assert body["status"] == "degraded"
