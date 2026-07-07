"""Authentication dependency — validates tokens via PocketBase.

The dependency accepts auth from two sources (cookie first, header fallback):

1. **HttpOnly cookie** (``stadiumiq_token``): Set by ``POST /api/auth/login``.
   Preferred because it is not accessible to JavaScript (XSS-proof).

2. **Bearer Authorization header**: Retained for direct API access and legacy
   PocketBase auth-store tokens from the React frontend.

In both cases the raw token is forwarded to PocketBase's ``auth-refresh``
endpoint for server-side validation.
"""

import logging
from typing import Any

import httpx
from fastapi import Cookie, Header, HTTPException

from app.core.config import get_settings

logger = logging.getLogger("stadiumiq")


async def get_current_user(
    authorization: str | None = Header(
        None, description="Bearer token from PocketBase auth"
    ),
    stadiumiq_token: str | None = Cookie(
        None, description="HttpOnly auth cookie from /api/auth/login"
    ),
) -> dict[str, Any]:
    """Validate a PocketBase token, accepting cookie or Bearer header.

    Cookie is checked first (more secure — inaccessible to JS).
    Falls back to the ``Authorization: Bearer <token>`` header.

    Args:
        authorization: Optional Authorization header.
        stadiumiq_token: Optional HttpOnly cookie set on login.

    Returns:
        The user record dict returned by PocketBase on successful refresh.

    Raises:
        HTTPException: 401 if no valid token is found or PocketBase rejects it.
    """
    settings = get_settings()

    # ── 1. Extract token — cookie takes precedence ────────────────────────
    token: str | None = None

    if stadiumiq_token:
        token = stadiumiq_token
        logger.debug("Authenticating via HttpOnly cookie")
    elif authorization and authorization.startswith("Bearer "):
        token = authorization[len("Bearer ") :]
        logger.debug("Authenticating via Authorization header")

    if not token:
        raise HTTPException(
            status_code=401,
            detail=(
                "Authentication required. "
                "Provide a Bearer token or log in via /api/auth/login to receive a session cookie."
            ),
        )

    # ── 2. Validate with PocketBase ───────────────────────────────────────
    url = f"{settings.pocketbase_url}/api/collections/users/auth-refresh"
    headers = {"Authorization": f"Bearer {token}"}

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, headers=headers)

        if response.status_code == 200:
            data = response.json()
            user_record: dict[str, Any] = data.get("record", data)
            logger.info(
                "User authenticated via PocketBase",
                extra={"extra_data": {"user_id": user_record.get("id")}},
            )
            return user_record

        # Any non-200 means the token is invalid or expired.
        logger.warning(
            "PocketBase auth-refresh rejected token",
            extra={"extra_data": {"status": response.status_code}},
        )
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token.",
        )

    except httpx.HTTPError as exc:
        logger.error(
            "PocketBase auth-refresh request failed",
            extra={"extra_data": {"error": str(exc)}},
        )
        raise HTTPException(
            status_code=401,
            detail="Authentication service unavailable.",
        ) from exc


async def get_optional_user(
    authorization: str | None = Header(
        None, description="Bearer token from PocketBase auth"
    ),
    stadiumiq_token: str | None = Cookie(
        None, description="HttpOnly auth cookie from /api/auth/login"
    ),
) -> dict[str, Any] | None:
    """Optional authentication dependency. Returns None if unauthenticated."""
    try:
        return await get_current_user(authorization, stadiumiq_token)
    except HTTPException:
        return None
