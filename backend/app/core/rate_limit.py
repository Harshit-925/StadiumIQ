"""Rate limiting configuration using slowapi.

Provides four rate-limit tiers:
- Fan-assist (public/unauthenticated): 5 requests/minute per IP
- AI routes (authenticated):           10 requests/minute
- Write routes:                         30 requests/minute
- Read routes:                          60 requests/minute

Uses in-memory storage by default; logs a warning at startup when
production runs on memory:// (should use Redis).
"""

import logging

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.config import get_settings

logger = logging.getLogger("stadiumiq")

settings = get_settings()

limiter = Limiter(
    key_func=get_remote_address,
    storage_uri=settings.rate_limit_storage_uri,
    strategy="fixed-window",
)

# ── Rate-limit string constants (used in route decorators) ───────────────
# Public endpoint — no auth required, tighter per-IP limit to prevent abuse
RATE_LIMIT_FAN_ASSIST_PUBLIC = "5/minute"
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
