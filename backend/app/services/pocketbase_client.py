"""PocketBase client — thin httpx wrapper for persisting analysis results.

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
    user_token: str,
    engine_result: dict[str, Any],
    ai_result: dict[str, Any] | None,
    fallback_used: bool,
) -> bool:
    """Persist an analysis result to PocketBase's ``history`` collection.

    Args:
        user_token: Bearer token for PocketBase authentication.
        engine_result: Deterministic engine output to store.
        ai_result: Optional AI insights to store alongside.
        fallback_used: Whether the AI fallback was used.

    Returns:
        ``True`` if the record was saved successfully, ``False`` otherwise.
    """
    settings = get_settings()
    url = f"{settings.pocketbase_url}/api/collections/history/records"

    payload: dict[str, Any] = {
        "engine_result": engine_result,
        "ai_result": ai_result,
        "fallback_used": fallback_used,
    }

    headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload, headers=headers)

        if response.status_code in (200, 201):
            logger.info(
                "Analysis result saved to PocketBase",
                extra={"extra_data": {"status": response.status_code}},
            )
            return True

        logger.warning(
            "PocketBase save returned non-success status",
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
            "PocketBase save failed — network error",
            extra={"extra_data": {"error": str(exc)}},
        )
        return False
    except Exception as exc:
        logger.error(
            "PocketBase save failed — unexpected error",
            extra={"extra_data": {"error": str(exc), "error_type": type(exc).__name__}},
        )
        return False
