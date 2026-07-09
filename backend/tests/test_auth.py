"""Tests for the authentication dependency (auth.py).

Verifies JWT validation via PyJWT — never hits a live Supabase service.
"""

from __future__ import annotations

import time
from unittest.mock import MagicMock, patch

import jwt
import pytest
from fastapi import HTTPException

from app.core.auth import get_current_user
from tests.conftest import TEST_JWT_SECRET, make_test_token


def _patch_secret(secret: str = TEST_JWT_SECRET):
    """Context manager: patch settings.supabase_jwt_secret."""
    mock_settings = MagicMock()
    mock_settings.supabase_jwt_secret = secret
    return patch("app.core.auth.get_settings", return_value=mock_settings)


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  VALID TOKEN                                                           ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestValidToken:
    """Tests where a well-formed Supabase JWT is presented."""

    async def test_valid_token_returns_user(self) -> None:
        """A valid bearer token should return the decoded JWT payload."""
        token = make_test_token()
        with _patch_secret():
            user = await get_current_user(authorization=f"Bearer {token}")

        assert user["sub"] == "test_user_123"
        assert user["email"] == "test@example.com"

    async def test_valid_token_via_cookie(self) -> None:
        """A valid token supplied via cookie should also be accepted."""
        token = make_test_token()
        with _patch_secret():
            user = await get_current_user(
                authorization=None,
                stadiumiq_token=token,
            )

        assert user["sub"] == "test_user_123"

    async def test_cookie_takes_precedence_over_header(self) -> None:
        """When both cookie and header are present, cookie wins."""
        cookie_payload = {"sub": "cookie_user", "email": "cookie@example.com"}
        cookie_token = make_test_token(user=cookie_payload)
        header_payload = {"sub": "header_user", "email": "header@example.com"}
        header_token = make_test_token(user=header_payload)

        with _patch_secret():
            user = await get_current_user(
                authorization=f"Bearer {header_token}",
                stadiumiq_token=cookie_token,
            )

        assert user["sub"] == "cookie_user"


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  INVALID TOKEN                                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestInvalidToken:
    """Tests where the JWT is rejected."""

    async def test_expired_token_raises_401(self) -> None:
        """An expired JWT should return HTTP 401."""
        payload = {
            "sub": "user_expired",
            "email": "x@example.com",
            "exp": int(time.time()) - 10,  # already expired
            "iat": int(time.time()) - 3610,
        }
        expired_token = jwt.encode(payload, TEST_JWT_SECRET, algorithm="HS256")

        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=f"Bearer {expired_token}")
            assert exc_info.value.status_code == 401
            assert "expired" in exc_info.value.detail.lower()

    async def test_wrong_secret_raises_401(self) -> None:
        """A JWT signed with a different secret should be rejected."""
        token = make_test_token(secret="wrong-secret")

        with _patch_secret(secret=TEST_JWT_SECRET):
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=f"Bearer {token}")
            assert exc_info.value.status_code == 401

    async def test_malformed_token_raises_401(self) -> None:
        """A garbled token string should return HTTP 401."""
        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer not.a.real.jwt")
            assert exc_info.value.status_code == 401


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  MISSING / MALFORMED HEADER                                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestMissingToken:
    """Tests for missing or malformed authorization headers."""

    async def test_no_bearer_prefix_raises_401(self) -> None:
        """Authorization without 'Bearer ' prefix → 401."""
        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Basic abc123")
            assert exc_info.value.status_code == 401

    async def test_empty_token_raises_401(self) -> None:
        """'Bearer ' with empty token → 401."""
        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearer ")
            assert exc_info.value.status_code == 401

    async def test_just_bearer_keyword_raises_401(self) -> None:
        """Just 'Bearer' without space → 401."""
        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization="Bearertoken")
            assert exc_info.value.status_code == 401

    async def test_no_auth_at_all_raises_401(self) -> None:
        """No header and no cookie → 401."""
        with _patch_secret():
            with pytest.raises(HTTPException) as exc_info:
                await get_current_user(authorization=None, stadiumiq_token=None)
            assert exc_info.value.status_code == 401
