"""Shared pytest fixtures for StadiumIQ backend tests.

All external services (Gemini AI, PocketBase, auth) are mocked to ensure
tests never hit live services.
"""

from __future__ import annotations

from collections.abc import AsyncIterator
from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from httpx import ASGITransport, AsyncClient

from app.core.auth import get_current_user
from app.main import create_app

# ── Fixed fake user returned by mock_auth ────────────────────────────────
FAKE_USER: dict[str, Any] = {
    "id": "test_user_123",
    "email": "test@example.com",
    "name": "Test User",
}


@pytest.fixture()
def app():
    """Create a fresh FastAPI app instance for each test."""
    return create_app()


@pytest.fixture()
async def client(app) -> AsyncIterator[AsyncClient]:
    """Provide an async HTTP client wired to the test app via ASGI transport."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


@pytest.fixture()
def mock_auth(app):
    """Override get_current_user to return a fixed fake user.

    This avoids hitting PocketBase for authentication during tests.
    """

    async def _fake_user() -> dict[str, Any]:
        return FAKE_USER

    app.dependency_overrides[get_current_user] = _fake_user
    yield FAKE_USER
    app.dependency_overrides.pop(get_current_user, None)


@pytest.fixture()
def mock_genai():
    """Patch the Gemini genai client used by ai_service.

    Yields a MagicMock whose ``models.generate_content`` method returns
    a response with configurable ``.text``.
    """
    mock_response = MagicMock()
    mock_response.text = "AI-generated test insight about stadium operations."

    mock_client = MagicMock()
    mock_client.models.generate_content.return_value = mock_response

    with patch("app.services.ai_service._get_client", return_value=mock_client) as _:
        yield mock_client


@pytest.fixture()
def mock_pocketbase():
    """Patch httpx.AsyncClient.post in pocketbase_client to return 201.

    This avoids hitting a real PocketBase instance during tests.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.text = '{"id": "record_123"}'
    mock_resp.json.return_value = {"id": "record_123"}

    with patch("app.services.pocketbase_client.httpx.AsyncClient") as mock_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_resp
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_cls.return_value = mock_instance
        yield mock_instance


@pytest.fixture(autouse=True)
def clear_ai_cache():
    """Clear the AI insight cache before every test.

    The in-process cache (``_insight_cache`` dict) is a module-level singleton.
    Without clearing it, a successful AI call in one test can satisfy cache
    lookups in subsequent tests that expect a fallback — causing false passes
    or false failures.
    """
    import app.services.ai_service as _ai

    _ai._insight_cache.clear()
    yield
    _ai._insight_cache.clear()
