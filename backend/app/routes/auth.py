"""Cookie-based authentication routes.

Provides login and logout endpoints that issue/clear HttpOnly, Secure,
SameSite=Strict cookies — eliminating XSS token theft via localStorage/
sessionStorage storage.

The raw PocketBase token is never exposed to client-side JavaScript.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Response
from pydantic import BaseModel, EmailStr, Field

from app.core.config import get_settings

logger = logging.getLogger("stadiumiq")

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

# ── Cookie configuration constants (importable by tests) ─────────────────
COOKIE_NAME = "stadiumiq_token"
COOKIE_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


class LoginRequest(BaseModel):
    """Request body for ``POST /api/auth/login``.

    Attributes:
        email: User email address.
        password: User password (never stored; forwarded to PocketBase).
    """

    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., min_length=1, description="User password")


class LoginResponse(BaseModel):
    """Response body for ``POST /api/auth/login``.

    The token itself is NOT included — it is stored in the HttpOnly cookie.

    Attributes:
        user_id: PocketBase record ID of the authenticated user.
        email: Authenticated user email.
        name: User display name.
    """

    user_id: str
    email: str
    name: str


@auth_router.post("/login", response_model=LoginResponse)
async def login(body: LoginRequest, response: Response) -> LoginResponse:
    """Authenticate via PocketBase and issue an HttpOnly session cookie.

    The token is stored in an HttpOnly, Secure, SameSite=Strict cookie so
    it is completely inaccessible to client-side JavaScript — closing the
    XSS token-theft attack surface that localStorage/sessionStorage exposes.

    Args:
        body: Login credentials (email + password).
        response: FastAPI Response object used to set the cookie.

    Returns:
        LoginResponse with user metadata (no raw token).

    Raises:
        HTTPException: 401 if PocketBase rejects the credentials.
        HTTPException: 503 if PocketBase is unreachable.
    """
    settings = get_settings()
    url = f"{settings.pocketbase_url}/api/collections/users/auth-with-password"

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            pb_response = await client.post(
                url,
                json={"identity": body.email, "password": body.password},
            )
    except httpx.HTTPError as exc:
        logger.error(
            "PocketBase unreachable during login",
            extra={"extra_data": {"error": str(exc)}},
        )
        raise HTTPException(
            status_code=503,
            detail="Authentication service temporarily unavailable.",
        ) from exc

    if pb_response.status_code != 200:
        logger.warning(
            "PocketBase rejected login credentials",
            extra={"extra_data": {"status": pb_response.status_code}},
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password.",
        )

    data = pb_response.json()
    token: str = data.get("token", "")
    record: dict[str, Any] = data.get("record", {})

    # ── Set the HttpOnly cookie ───────────────────────────────────────────
    # Secure=True → only sent over HTTPS (browser enforces in production).
    # HttpOnly=True → inaccessible to document.cookie / JS.
    # SameSite=strict → not sent on cross-site requests.
    response.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=True,
        samesite="strict",
        max_age=COOKIE_MAX_AGE,
        path="/",
    )

    logger.info(
        "User logged in — HttpOnly cookie issued",
        extra={"extra_data": {"user_id": record.get("id")}},
    )

    return LoginResponse(
        user_id=record.get("id", ""),
        email=record.get("email", body.email),
        name=record.get("name", ""),
    )


@auth_router.post("/logout", status_code=204)
async def logout(response: Response) -> None:
    """Clear the session cookie, logging the user out.

    Deletes the HttpOnly cookie by setting Max-Age=0 and an empty value.

    Args:
        response: FastAPI Response used to clear the cookie.
    """
    response.delete_cookie(
        key=COOKIE_NAME,
        httponly=True,
        secure=True,
        samesite="strict",
        path="/",
    )
    logger.info("User logged out — cookie cleared")
    return None
