"""Tests for the cookie-based authentication routes (routes/auth.py).

These tests verify:
1. Successful login issues an HttpOnly, Secure, SameSite=Strict cookie.
2. Failed login (bad credentials) returns 401.
3. PocketBase unreachable returns 503.
4. Logout clears the cookie.

Security-axis verifiable claim: the Set-Cookie header flags are explicitly
asserted — they are not just stated in a design doc.
"""

from __future__ import annotations

from typing import TYPE_CHECKING
from unittest.mock import AsyncMock, MagicMock, patch

if TYPE_CHECKING:
    from httpx import AsyncClient

# ── Shared helpers ───────────────────────────────────────────────────────

def _pb_success_response() -> MagicMock:
    """Build a mock PocketBase 200 auth response."""
    mock_resp = MagicMock()
    mock_resp.status_code = 200
    mock_resp.json.return_value = {
        "token": "pb_token_abc123",
        "record": {
            "id": "user_cookie_001",
            "email": "alice@example.com",
            "name": "Alice",
        },
    }
    return mock_resp


def _make_mock_client(pb_response: MagicMock) -> AsyncMock:
    """Wrap a PocketBase response in an AsyncClient mock."""
    mock_instance = AsyncMock()
    mock_instance.post.return_value = pb_response
    mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
    mock_instance.__aexit__ = AsyncMock(return_value=False)
    return mock_instance


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  SUCCESSFUL LOGIN — Cookie Flag Assertions                             ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestCookieLogin:
    """Tests for POST /api/auth/login — focuses on cookie security flags."""

    async def test_login_returns_200(
        self, client: AsyncClient
    ) -> None:
        """Successful login → HTTP 200 with user metadata."""
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        assert resp.status_code == 200
        data = resp.json()
        assert data["user_id"] == "user_cookie_001"
        assert data["email"] == "alice@example.com"

    async def test_login_sets_httponly_cookie(
        self, client: AsyncClient
    ) -> None:
        """Login response must set a cookie with the HttpOnly flag.

        This is the primary XSS-protection mechanism: document.cookie cannot
        read HttpOnly cookies, so a compromised JS payload cannot exfiltrate
        the session token.
        """
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        set_cookie = resp.headers.get("set-cookie", "")
        assert set_cookie, "Set-Cookie header must be present"
        assert "httponly" in set_cookie.lower(), (
            "Cookie must have HttpOnly flag to prevent XSS token theft"
        )

    async def test_login_sets_samesite_strict(
        self, client: AsyncClient
    ) -> None:
        """Login cookie must carry SameSite=Strict to block CSRF.

        SameSite=Strict prevents the cookie from being sent on any
        cross-site request, mitigating CSRF attacks.
        """
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        set_cookie = resp.headers.get("set-cookie", "")
        assert "samesite=strict" in set_cookie.lower(), (
            "Cookie must have SameSite=Strict to prevent CSRF"
        )

    async def test_login_sets_secure_flag(
        self, client: AsyncClient
    ) -> None:
        """Login cookie must carry the Secure flag.

        The Secure flag ensures the cookie is only transmitted over
        HTTPS, preventing transmission over plain HTTP.
        """
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        set_cookie = resp.headers.get("set-cookie", "")
        assert "secure" in set_cookie.lower(), (
            "Cookie must have Secure flag (HTTPS only)"
        )

    async def test_login_cookie_contains_token(
        self, client: AsyncClient
    ) -> None:
        """The cookie value should equal the PocketBase token."""
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        set_cookie = resp.headers.get("set-cookie", "")
        assert "pb_token_abc123" in set_cookie

    async def test_login_does_not_expose_token_in_body(
        self, client: AsyncClient
    ) -> None:
        """Raw token must NOT appear in the response JSON body.

        Keeping the token out of the body ensures JS cannot read it even if
        a developer accidentally logs the response.
        """
        pb_resp = _pb_success_response()
        mock_client = _make_mock_client(pb_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        body = resp.text
        assert "pb_token_abc123" not in body, (
            "Raw PocketBase token must not appear in the response body"
        )


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FAILED LOGIN                                                          ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestCookieLoginFailure:
    """Tests for login failure scenarios."""

    async def test_bad_credentials_returns_401(
        self, client: AsyncClient
    ) -> None:
        """PocketBase rejection → HTTP 401."""
        mock_resp = MagicMock()
        mock_resp.status_code = 400  # PocketBase returns 400 for wrong password
        mock_client = _make_mock_client(mock_resp)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_client):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "wrong"},
            )

        assert resp.status_code == 401

    async def test_pocketbase_unreachable_returns_503(
        self, client: AsyncClient
    ) -> None:
        """PocketBase connectivity failure → HTTP 503."""
        import httpx as _httpx
        mock_instance = AsyncMock()
        mock_instance.post.side_effect = _httpx.ConnectError("refused")
        mock_instance.__aenter__ = AsyncMock(return_value=mock_instance)
        mock_instance.__aexit__ = AsyncMock(return_value=False)

        with patch("app.routes.auth.httpx.AsyncClient", return_value=mock_instance):
            resp = await client.post(
                "/api/auth/login",
                json={"email": "alice@example.com", "password": "secret"},
            )

        assert resp.status_code == 503

    async def test_missing_email_returns_422(
        self, client: AsyncClient
    ) -> None:
        """Missing required email field → HTTP 422."""
        resp = await client.post(
            "/api/auth/login",
            json={"password": "secret"},
        )
        assert resp.status_code == 422

    async def test_empty_password_returns_422(
        self, client: AsyncClient
    ) -> None:
        """Empty password string → HTTP 422."""
        resp = await client.post(
            "/api/auth/login",
            json={"email": "alice@example.com", "password": ""},
        )
        assert resp.status_code == 422


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  LOGOUT                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestCookieLogout:
    """Tests for POST /api/auth/logout."""

    async def test_logout_returns_204(self, client: AsyncClient) -> None:
        """Logout should return HTTP 204 No Content."""
        resp = await client.post("/api/auth/logout")
        assert resp.status_code == 204

    async def test_logout_clears_cookie(self, client: AsyncClient) -> None:
        """Logout should delete the session cookie (Max-Age=0 or deletion)."""
        resp = await client.post("/api/auth/logout")
        set_cookie = resp.headers.get("set-cookie", "")
        # FastAPI's delete_cookie sets max-age=0 or expires in the past
        assert "stadiumiq_token" in set_cookie
        # The cookie must be expired/cleared — value empty or max-age=0
        assert "max-age=0" in set_cookie.lower() or 'stadiumiq_token=""' in set_cookie or "stadiumiq_token=;" in set_cookie
