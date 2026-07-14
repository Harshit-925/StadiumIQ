"""Generate narrative crowd-operations insights from engine output."""

from __future__ import annotations

import logging
import time
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from google.genai.types import GenerateContentResponse


from app.services.ai_service._shared import (
    CACHE_TTL_SECONDS,
    _build_fallback_text,
    _insight_cache,
    _strip_json_fences,
)

logger = logging.getLogger("stadiumiq")


async def generate_crowd_insights(
    engine_result: dict[str, Any],
) -> tuple[str, bool]:
    """Generate a narrative analysis of stadium operations from engine output.

    Args:
        engine_result: The deterministic engine output dict.

    Returns:
        A tuple of (insights_text, fallback_used).  If AI is unavailable or
        disabled, returns a deterministic summary built from the engine data.
    """

    # Build cache key based on venue and readiness score bucket
    venue_id = engine_result.get("venue", {}).get("venue_id", "unknown")
    score = engine_result.get("readiness", {}).get("score", 0.0)
    bucket = str(round(score / 10) * 10)  # Bucket to nearest 10
    match_phase = "active"
    cache_key = (venue_id, bucket, match_phase)

    now = time.time()
    if cache_key in _insight_cache:
        cached_text, timestamp = _insight_cache[cache_key]
        if now - timestamp < CACHE_TTL_SECONDS:
            logger.info(
                "AI insight served from cache",
                extra={"extra_data": {"cache_key": str(cache_key)}},
            )
            return cached_text, False

    prompt = (
        "You are StadiumIQ, a FIFA World Cup 2026 stadium operations analyst. "
        "Analyze the following stadium data and provide actionable insights "
        "in 3-5 concise paragraphs. Focus on safety, crowd management, accessibility compliance, "
        "sustainability performance, and recommended routing for entry, exit, and transport "
        "connections, alongside operational recommendations.\n\n"
        f"Data: {engine_result}"
    )

    from google import genai  # noqa: PLC0415
    async def _generate(client: genai.Client) -> tuple[str, bool]:
        response: GenerateContentResponse = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text or ""
        text = _strip_json_fences(text)

        if not text:
            logger.warning(
                "AI returned empty response — using fallback",
                extra={"extra_data": {"reason": "empty_ai_response"}},
            )
            return _build_fallback_text(engine_result), True

        if len(_insight_cache) > 1000:
            _insight_cache.clear()
        _insight_cache[cache_key] = (text, time.time())
        return text, False

    from app.services.ai_service._shared import safe_ai_call
    return await safe_ai_call(
        str(engine_result), 
        (_build_fallback_text(engine_result), True), 
        _generate, 
        "crowd_insights"
    )
