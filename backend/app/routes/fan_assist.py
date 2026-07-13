"""Fan assistant route — POST /api/fan-assist."""

from __future__ import annotations

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException, Request

from app.core.auth import get_optional_user
from app.core.rate_limit import (
    RATE_LIMIT_FAN_ASSIST_AUTH,
    RATE_LIMIT_FAN_ASSIST_PUBLIC,
    _fan_assist_key,
    limiter,
)
from app.engine.calculator import get_venue_info
from app.models.schemas import FanAssistRequest, FanAssistResponse
from app.services import ai_service

logger = logging.getLogger("stadiumiq")

router = APIRouter()


@router.post("/fan-assist", response_model=FanAssistResponse)
@limiter.limit(RATE_LIMIT_FAN_ASSIST_AUTH, key_func=_fan_assist_key)  # 10/min authenticated
@limiter.limit(RATE_LIMIT_FAN_ASSIST_PUBLIC)  # 5/min anonymous (IP fallback)
async def fan_assist(
    request: Request,
    body: FanAssistRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> FanAssistResponse:
    """AI-powered fan question-and-answer assistant.

    This endpoint is **public** — no authentication is required, so fans can
    use it without logging in. A strict per-IP rate limit of 5 requests/minute
    applies to prevent abuse.

    Authenticated operators receive the same response; the ``user`` dependency
    is optional and used only for contextual logging if present.

    Args:
        request: The Starlette request (needed by slowapi).
        body: Validated request body.
        user: Optional authenticated user record from Supabase.

    Returns:
        FanAssistResponse with the assistant's reply.
    """
    try:
        venue_context = None
        if body.venue_id:
            try:
                venue_context = get_venue_info(body.venue_id)
            except ValueError:
                pass  # non-critical — proceed without venue context

        text, fallback_used = await ai_service.generate_fan_response(
            query=body.query,
            language=body.language,
            venue_context=venue_context,
        )

        source = "gemini-2.5-flash" if not fallback_used else "fallback"

        return FanAssistResponse(
            response=text,
            language=body.language,
            source=source,
            fallback_used=fallback_used,
        )

    except HTTPException:
        raise
