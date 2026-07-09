"""Supabase client — thin httpx wrapper for persisting analysis results.

Uses the Supabase REST API with the service_role key for server-side inserts
that bypass Row Level Security. The user_id is extracted from the validated
JWT payload so the record is correctly attributed.

Never crashes the calling request — all errors are caught, logged, and the
function returns ``False`` to indicate failure.
"""

from __future__ import annotations

import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger("stadiumiq")


async def save_result(
    user_id: str,
    venue_id: str,
    engine_result: dict[str, Any],
    ai_result: dict[str, Any] | None,
    fallback_used: bool,
) -> bool:
    """Persist an analysis result to Supabase's ``history`` table.

    Uses the service_role key so RLS is bypassed on the insert. The
    user_id is the authenticated user's UUID from the Supabase JWT (``sub``).

    Args:
        user_id: Authenticated user's UUID (from JWT ``sub`` claim).
        venue_id: Venue slug identifier.
        engine_result: Deterministic engine output to store as JSONB.
        ai_result: Optional AI insights to store alongside.
        fallback_used: Whether the AI fallback was used.

    Returns:
        ``True`` if the record was saved successfully, ``False`` otherwise.
    """
    settings = get_settings()

    if not settings.supabase_url or not settings.supabase_service_role_key:
        logger.warning("Supabase not configured — skipping history save")
        return False

    url = f"{settings.supabase_url}/rest/v1/history"

    payload: dict[str, Any] = {
        "user_id": user_id,
        "venue_id": venue_id,
        "engine_result": engine_result,
        "ai_result": ai_result,
        "fallback_used": fallback_used,
    }

    headers = {
        "apikey": settings.supabase_service_role_key,
        "Authorization": f"Bearer {settings.supabase_service_role_key}",
        "Content-Type": "application/json",
        "Prefer": "return=minimal",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code in (200, 201):
            logger.info(
                "Analysis result saved to Supabase",
                extra={"extra_data": {"status": response.status_code, "user_id": user_id}},
            )
            return True

        logger.warning(
            "Supabase save returned non-success status",
            extra={
                "extra_data": {
                    "status": response.status_code,
                    "body": response.text[:200],
                }
            },
        )
        return False

    except httpx.HTTPError as exc:
        logger.error(
            "Supabase save failed — network error",
            extra={"extra_data": {"error": str(exc)}},
        )
        return False
    except Exception as exc:
        logger.error(
            "Supabase save failed — unexpected error",
            extra={"extra_data": {"error": str(exc), "error_type": type(exc).__name__}},
        )
        return False
