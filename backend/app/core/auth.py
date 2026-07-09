"""Authentication dependency — validates Supabase JWTs locally.

Validates the Supabase JWT using the project's JWT secret (HS256).
No network round-trip required — verification is purely local, making it
fast and resilient to Supabase downtime.

Token sources accepted (cookie first, header fallback):
1. **HttpOnly cookie** (``stadiumiq_token``): Set externally if using a
   cookie-forwarding pattern.
2. **Bearer Authorization header**: The standard Supabase flow — the frontend
   attaches the access_token from supabase.auth.getSession() as a Bearer header.
"""

from __future__ import annotations

import logging
from typing import Any

import jwt
from fastapi import Cookie, Header, HTTPException

from app.core.config import get_settings

logger = logging.getLogger("stadiumiq")


async def get_current_user(
    authorization: str | None = Header(default=None),
    stadiumiq_token: str | None = Cookie(default=None),
) -> dict[str, Any]:
    """Validate a Supabase JWT, accepting cookie or Bearer header.

    Cookie is checked first. Falls back to ``Authorization: Bearer <token>``.

    Args:
        authorization: Optional Authorization header.
        stadiumiq_token: Optional HttpOnly cookie value.

    Returns:
        The decoded JWT payload as a dict (includes ``sub``, ``email``, etc.).

    Raises:
        HTTPException: 401 if no valid token is found or the JWT is invalid/expired.
    """
    settings = get_settings()

    # ── 1. Extract raw token ─────────────────────────────────────────
    raw_token: str | None = None

    if stadiumiq_token and isinstance(stadiumiq_token, str) and stadiumiq_token.strip():
        raw_token = stadiumiq_token
        logger.debug("Authenticating via HttpOnly cookie")
    elif authorization and isinstance(authorization, str) and authorization.startswith("Bearer "):
        candidate = authorization[len("Bearer "):]
        if candidate.strip():
            raw_token = candidate
            logger.debug("Authenticating via Authorization header")

    if not raw_token:
        raise HTTPException(
            status_code=401,
            detail=(
                "Authentication required. "
                "Provide a Bearer token from Supabase or log in via the frontend."
            ),
        )

    # ── 2. Verify locally with PyJWT ────────────────────────────────
    jwt_secret = settings.supabase_jwt_secret

    try:
        payload: dict[str, Any] = jwt.decode(
            raw_token,
            jwt_secret,
            algorithms=["HS256"],
            options={"require": ["sub", "exp"]},
        )
        logger.info(
            "User authenticated via Supabase JWT",
            extra={"extra_data": {"user_id": payload.get("sub")}},
        )
        return payload

    except jwt.ExpiredSignatureError as exc:
        logger.warning("Supabase JWT has expired")
        raise HTTPException(status_code=401, detail="Token has expired.") from exc

    except jwt.InvalidTokenError as exc:
        logger.warning(
            "Invalid Supabase JWT",
            extra={"extra_data": {"error": str(exc)}},
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token. Please log in again.",
        ) from exc


async def get_optional_user(
    authorization: str | None = Header(default=None),
    stadiumiq_token: str | None = Cookie(default=None),
) -> dict[str, Any] | None:
    """Optional authentication dependency. Returns None if unauthenticated."""
    try:
        return await get_current_user(authorization, stadiumiq_token)
    except HTTPException:
        return None
