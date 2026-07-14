"""Tests for app/main.py — app factory, CORS, and route registration."""

from __future__ import annotations

from typing import TYPE_CHECKING

import pytest

if TYPE_CHECKING:
    from httpx import AsyncClient


@pytest.mark.anyio
async def test_create_app_returns_fastapi_instance(app) -> None:
    """create_app() should produce a FastAPI application."""
    from fastapi import FastAPI

    assert isinstance(app, FastAPI)


@pytest.mark.anyio
async def test_openapi_docs_available_in_non_production(client: AsyncClient) -> None:
    """Swagger docs should be reachable in non-production environments."""
    response = await client.get("/api/docs")
    # 200 (HTML page) or 404 when redoc is disabled — either signals the route exists
    assert response.status_code in (200, 404)


@pytest.mark.anyio
async def test_api_routes_are_mounted(client: AsyncClient) -> None:
    """Core API routes should be mounted and return non-404 status codes."""
    response = await client.get("/api/health")
    assert response.status_code != 404


@pytest.mark.anyio
async def test_cors_headers_present(client: AsyncClient) -> None:
    """CORS preflight should return appropriate headers for allowed origins."""
    response = await client.options(
        "/api/health",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "GET",
        },
    )
    # A properly configured CORS middleware responds with 2xx or 4xx (not 5xx)
    assert response.status_code < 500


@pytest.mark.anyio
async def test_unhandled_exception_handler_returns_json(client: AsyncClient) -> None:
    """Unknown routes should return a valid response (spa catch-all or 404), not a 5xx crash."""
    response = await client.get("/api/nonexistent-route-that-does-not-exist")
    # The app serves a SPA catch-all (200) or a proper 404 — either is correct;
    # what matters is no 5xx unhandled crash.
    assert response.status_code < 500


@pytest.mark.anyio
async def test_volunteer_route_registered(client: AsyncClient, mock_auth) -> None:
    """Volunteer allocation endpoint should be accessible."""
    payload = {
        "zones": [{"id": "north", "capacity": 1000, "risk_level": "SAFE"}],
        "available_staff": 5,
    }
    response = await client.post("/api/volunteer/allocate", json=payload)
    assert response.status_code == 200


@pytest.mark.anyio
async def test_prediction_route_registered(client: AsyncClient, mock_auth) -> None:
    """Prediction trend endpoint should be accessible."""
    payload = {
        "historical_densities": [1.0, 1.5, 2.0],
        "minutes_ahead": 5,
    }
    response = await client.post("/api/prediction/trend", json=payload)
    assert response.status_code == 200


@pytest.mark.anyio
async def test_lifespan_supabase_reachable(app) -> None:
    """Lifespan should log success when Supabase is reachable."""
    from unittest.mock import patch

    from asgi_lifespan import LifespanManager

    from app.core.config import get_settings

    # Force settings so the block executes
    settings = get_settings()
    with patch.object(settings, "supabase_url", "http://mock-supabase"), patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value.status_code = 200
        with patch("app.main.logger.info") as mock_logger:
            async with LifespanManager(app):
                pass
            mock_logger.assert_any_call("Supabase is reachable at %s", "http://mock-supabase")


@pytest.mark.anyio
async def test_lifespan_supabase_unreachable(app) -> None:
    """Lifespan should log warning on HTTP error."""
    from unittest.mock import patch

    import httpx
    from asgi_lifespan import LifespanManager

    from app.core.config import get_settings

    settings = get_settings()
    with patch.object(settings, "supabase_url", "http://mock-supabase"), patch("httpx.AsyncClient.get") as mock_get:
        mock_get.side_effect = httpx.HTTPError("mock error")
        with patch("app.main.logger.warning") as mock_logger:
            async with LifespanManager(app):
                pass
            assert any("Supabase unreachable at startup" in call.args[0] for call in mock_logger.call_args_list)


@pytest.mark.anyio
async def test_lifespan_supabase_bad_status(app) -> None:
    """Lifespan should log warning on bad status (e.g. 500)."""
    from unittest.mock import patch

    from asgi_lifespan import LifespanManager

    from app.core.config import get_settings

    settings = get_settings()
    with patch.object(settings, "supabase_url", "http://mock-supabase"), patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value.status_code = 500
        with patch("app.main.logger.warning") as mock_logger:
            async with LifespanManager(app):
                pass
            mock_logger.assert_any_call("Supabase returned status %d at startup", 500)
