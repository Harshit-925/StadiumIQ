"""Shared pytest fixtures for StadiumIQ backend tests.

All external services (Gemini AI, Supabase) are mocked to ensure
tests never hit live services.
"""

from __future__ import annotations

import time
from typing import TYPE_CHECKING, Any
from unittest.mock import AsyncMock, MagicMock, patch

import jwt
import pytest
from httpx import ASGITransport, AsyncClient

from app.core.auth import get_current_user, get_optional_user
from app.main import create_app

if TYPE_CHECKING:
    from collections.abc import AsyncIterator

# ── Shared JWT secret used in all tests ────────────────────────────────────
TEST_JWT_SECRET = "test-jwt-secret-for-unit-tests-only"

# ── Fixed fake user returned by mock_auth ───────────────────────────────────
FAKE_USER: dict[str, Any] = {
    "sub": "test_user_123",
    "email": "test@example.com",
    "name": "Test User",
}


def make_test_token(user: dict[str, Any] = FAKE_USER, secret: str = TEST_JWT_SECRET) -> str:
    """Generate a valid HS256 JWT for testing."""
    payload = {
        **user,
        "exp": int(time.time()) + 3600,  # valid for 1 hour
        "iat": int(time.time()),
        "iss": "supabase",
    }
    return jwt.encode(payload, secret, algorithm="HS256")


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
    """Override get_current_user AND get_optional_user to return a fixed fake user.

    get_optional_user is what /api/analyze actually depends on.
    This avoids hitting Supabase for JWT verification during tests.
    """

    async def _fake_user() -> dict[str, Any]:
        return FAKE_USER

    app.dependency_overrides[get_current_user] = _fake_user
    app.dependency_overrides[get_optional_user] = _fake_user
    yield FAKE_USER
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_optional_user, None)


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
def mock_supabase():
    """Patch httpx.AsyncClient.post in supabase_client to return 201.

    This avoids hitting a real Supabase instance during tests.
    """
    mock_resp = MagicMock()
    mock_resp.status_code = 201
    mock_resp.text = ""
    mock_resp.json.return_value = {}

    with patch("app.services.supabase_client.httpx.AsyncClient") as mock_cls:
        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_resp
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)
        mock_cls.return_value = mock_instance
        yield mock_instance


# Keep backward-compatible alias so test_routes.py can use mock_pocketbase fixture name
@pytest.fixture()
def mock_pocketbase(mock_supabase):
    """Backward-compat alias for mock_supabase."""
    yield mock_supabase


@pytest.fixture(autouse=True)
def clear_ai_cache():
    """Clear the AI insight cache before every test."""
    import app.services.ai_service as _ai

    _ai._insight_cache.clear()
    yield
    _ai._insight_cache.clear()


@pytest.fixture()
def patch_jwt_secret():
    """Patch settings so JWT verification uses the test secret."""
    with patch("app.core.auth.get_settings") as mock_settings:
        settings = MagicMock()
        settings.supabase_jwt_secret = TEST_JWT_SECRET
        mock_settings.return_value = settings
        yield settings
