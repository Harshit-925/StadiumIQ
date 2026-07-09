"""Rate limiting configuration using slowapi.

Provides four rate-limit tiers:
- Fan-assist (public/unauthenticated): 5 requests/minute per IP
- Fan-assist (authenticated operator): 10 requests/minute per user ID
- AI routes (authenticated):           10 requests/minute
- Write routes:                         30 requests/minute
- Read routes:                          60 requests/minute

Uses in-memory storage by default; logs a warning at startup when
production runs on memory:// (should use Redis).
"""

import logging

from fastapi import Request
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

# Cookie name used for auth-aware rate-limiting (checked but not set here)
COOKIE_NAME = "stadiumiq_token"

logger = logging.getLogger("stadiumiq")

settings = get_settings()


def _fan_assist_key(request: Request) -> str:
    """Auth-aware key function for the fan-assist endpoint.

    Authenticated callers (cookie or Bearer header present) are keyed by
    a prefix + token fragment so they share the operator limit (10/min),
    not the public per-IP limit (5/min).  Falls back to remote IP for
    anonymous callers.
    """
    token: str | None = request.cookies.get(COOKIE_NAME)
    if not token:
        auth_header = request.headers.get("authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[len("Bearer "):]

    if token:
        # Key on a prefix + first 16 chars — enough to identify a session,
        # not enough to reconstruct the full token.
        return f"authenticated:{token[:16]}"

    return get_remote_address(request)


limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.rate_limit_storage_uri,
    strategy="fixed-window",
)

# ── Rate-limit string constants (used in route decorators) ───────────────
# Public endpoint — no auth required, tighter per-IP limit to prevent abuse
RATE_LIMIT_FAN_ASSIST_PUBLIC = "5/minute"
# Authenticated fan-assist — operator overlay during live events
RATE_LIMIT_FAN_ASSIST_AUTH = "10/minute"
# Authenticated AI endpoints
RATE_LIMIT_AI = "10/minute"
RATE_LIMIT_WRITE = "30/minute"
RATE_LIMIT_READ = "60/minute"


def check_production_storage() -> None:
    """Log a warning if production uses in-memory rate-limit storage.

    Should be called once at application startup.
    """
    if (
        settings.environment == "production"
        and settings.rate_limit_storage_uri == "memory://"
    ):
        logger.warning(
            "Rate-limit storage is memory:// in production — "
            "rate limits are NOT shared across workers. "
            "Configure RATE_LIMIT_STORAGE_URI to point at Redis.",
            extra={"extra_data": {"environment": settings.environment}},
        )
