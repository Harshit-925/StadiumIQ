import pytest
from unittest.mock import AsyncMock, patch

import httpx
from app.services.supabase_client import save_result
from app.core.config import Settings


@pytest.fixture
def mock_settings():
    return Settings(
        supabase_url="https://test.supabase.co",
        supabase_service_role_key="test-key",
        environment="test",
        use_ai=False,
    )


@pytest.mark.asyncio
async def test_save_result_success(mock_settings, monkeypatch):
    monkeypatch.setattr("app.services.supabase_client.get_settings", lambda: mock_settings)

    with patch("app.services.supabase_client.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status_code = 201
        mock_client.post.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client_cls.return_value = mock_client

        result = await save_result(
            user_id="test-user",
            venue_id="test-venue",
            engine_result={"score": 100},
            ai_result=None,
            fallback_used=True,
        )
        assert result is True
        mock_client.post.assert_called_once()


@pytest.mark.asyncio
async def test_save_result_missing_config(mock_settings, monkeypatch):
    mock_settings.supabase_url = ""
    monkeypatch.setattr("app.services.supabase_client.get_settings", lambda: mock_settings)

    result = await save_result(
        user_id="test-user",
        venue_id="test-venue",
        engine_result={"score": 100},
        ai_result=None,
        fallback_used=True,
    )
    assert result is False


@pytest.mark.asyncio
async def test_save_result_http_error(mock_settings, monkeypatch):
    monkeypatch.setattr("app.services.supabase_client.get_settings", lambda: mock_settings)

    with patch("app.services.supabase_client.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post.side_effect = httpx.HTTPError("Network error")
        mock_client.__aenter__.return_value = mock_client
        mock_client_cls.return_value = mock_client

        result = await save_result(
            user_id="test-user",
            venue_id="test-venue",
            engine_result={"score": 100},
            ai_result=None,
            fallback_used=True,
        )
        assert result is False


@pytest.mark.asyncio
async def test_save_result_non_200_status(mock_settings, monkeypatch):
    monkeypatch.setattr("app.services.supabase_client.get_settings", lambda: mock_settings)

    with patch("app.services.supabase_client.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_response = AsyncMock()
        mock_response.status_code = 400
        mock_response.text = "Bad Request"
        mock_client.post.return_value = mock_response
        mock_client.__aenter__.return_value = mock_client
        mock_client_cls.return_value = mock_client

        result = await save_result(
            user_id="test-user",
            venue_id="test-venue",
            engine_result={"score": 100},
            ai_result=None,
            fallback_used=True,
        )
        assert result is False


@pytest.mark.asyncio
async def test_save_result_unexpected_error(mock_settings, monkeypatch):
    monkeypatch.setattr("app.services.supabase_client.get_settings", lambda: mock_settings)

    with patch("app.services.supabase_client.httpx.AsyncClient") as mock_client_cls:
        mock_client = AsyncMock()
        mock_client.post.side_effect = ValueError("Something completely unexpected")
        mock_client.__aenter__.return_value = mock_client
        mock_client_cls.return_value = mock_client

        result = await save_result(
            user_id="test-user",
            venue_id="test-venue",
            engine_result={"score": 100},
            ai_result=None,
            fallback_used=True,
        )
        assert result is False
