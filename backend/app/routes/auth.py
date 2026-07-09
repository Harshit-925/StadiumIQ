"""Auth routes — stub module retained for future server-side auth endpoints.

With Supabase, authentication is handled client-side by the Supabase JS SDK.
The backend validates JWTs locally (see app/core/auth.py) — it no longer
needs to proxy credentials to an external auth service.

This module is intentionally minimal. It is kept so that:
- The import in app/main.py continues to work without code changes.
- Future server-side auth endpoints (e.g. password reset webhooks) have a
  natural home.
"""

from __future__ import annotations

from fastapi import APIRouter

auth_router = APIRouter(prefix="/api/auth", tags=["Auth"])

# No endpoints — Supabase JS SDK handles login/signup/logout client-side.
# The backend only validates JWTs (see app.core.auth.get_current_user).
