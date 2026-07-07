"""Tests for the authentication dependency (auth.py).

Mocks httpx calls to PocketBase — never hits a live auth service.
"""

from __future__ import annotations

from unittest.mock import AsyncMock, MagicMock, patch

import httpx
import pytest
from fastapi import HTTPException

from app.core.auth import get_current_user

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  VALID TOKEN                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestValidToken:
    """Tests where PocketBase accepts the token."""

    async def test_valid_token_returns_user(self) -> None:
        """A valid bearer token should return the user record."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "record": {
                "id": "user_abc",
                "email": "alice@example.com",
                "name": "Alice",
            },
            "token": "refreshed_token",
        }

        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.auth.httpx.AsyncClient", return_value=mock_instance):
            user = await get_current_user(authorization="Bearer valid_token_123")

        assert user["id"] == "user_abc"
        assert user["email"] == "alice@example.com"

    async def test_valid_token_without_record_key(self) -> None:
        """PocketBase response without 'record' key → uses full data."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "id": "user_xyz",
            "email": "bob@example.com",
        }

        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.auth.httpx.AsyncClient", return_value=mock_instance):
            user = await get_current_user(authorization="Bearer another_token")

        assert user["id"] == "user_xyz"


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  INVALID TOKEN                                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestInvalidToken:
    """Tests where PocketBase rejects the token."""

    async def test_expired_token_raises_401(self) -> None:
        """PocketBase returns 401 → HTTPException 401."""
        mock_response = MagicMock()
        mock_response.status_code = 401
        mock_response.text = "Token expired"

        mock_instance = AsyncMock()
        mock_instance.post.return_value = mock_response
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.auth.httpx.AsyncClient", return_value=mock_instance):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer expired_token")
            assert exc_info.value.status_code == 401

    async def test_network_error_raises_401(self) -> None:
        """httpx network error → HTTPException 401 (service unavailable)."""
        mock_instance = AsyncMock()
        mock_instance.post.side_effect = httpx.ConnectError("Connection refused")
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)

        with patch("app.core.auth.httpx.AsyncClient", return_value=mock_instance):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer some_token")
            assert exc_info.value.status_code == 401
            assert "unavailable" in exc_info.value.detail.lower()


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  MISSING / MALFORMED TOKEN                                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestMissingToken:
    """Tests for missing or malformed authorization headers."""

    async def test_no_bearer_prefix_raises_401(self) -> None:
        """Authorization without 'Bearer ' prefix → 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization="Basic abc123")
        assert exc_info.value.status_code == 401

    async def test_empty_token_raises_401(self) -> None:
        """'Bearer ' with empty token → 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization="Bearer ")
        assert exc_info.value.status_code == 401

    async def test_just_bearer_keyword_raises_401(self) -> None:
        """Just the word 'Bearer' without space → 401."""
        with pytest.raises(HTTPException) as exc_info:
            await get_current_user(authorization="Bearertoken")
        assert exc_info.value.status_code == 401
