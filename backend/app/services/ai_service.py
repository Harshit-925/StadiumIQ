"""Gemini AI service — generates narrative insights and fan-facing responses.

Uses the google-genai SDK with ``gemini-2.5-flash``.  Every public function
follows a *never-crash* contract: on any exception the function returns a
deterministic fallback string and ``fallback_used=True``.
"""

from __future__ import annotations

import logging
import re
import time
from typing import TYPE_CHECKING, Any

from google import genai

from app.core.config import get_settings

if TYPE_CHECKING:
    from google.genai.types import GenerateContentResponse

logger = logging.getLogger("stadiumiq")

# ── Lazy singleton client ────────────────────────────────────────────────
_client: genai.Client | None = None

# ── Caching ──────────────────────────────────────────────────────────────
# (venue_id, bucket, match_phase) -> (narrative_text, timestamp)
_insight_cache: dict[tuple[str, str, str], tuple[str, float]] = {}
CACHE_TTL_SECONDS = 60.0


def _get_client() -> genai.Client:
    """Return a lazily-initialised Gemini client.

    Returns:
        A configured ``genai.Client`` instance.
    """
    global _client  # noqa: PLW0603
    if _client is None:
        settings = get_settings()
        _client = genai.Client(api_key=settings.gemini_api_key)
    return _client


def _strip_json_fences(text: str) -> str:
    """Remove markdown code fences (```json … ```) from AI output.

    Args:
        text: Raw AI response text.

    Returns:
        Cleaned text without code fences.
    """
    text = re.sub(r"```json\s*", "", text)
    text = re.sub(r"```\s*", "", text)
    return text.strip()


def _build_fallback_text(engine_result: dict[str, Any]) -> str:
    """Build a plain-text summary from the engine result when AI is unavailable.

    Args:
        engine_result: The deterministic engine output dict.

    Returns:
        A human-readable summary string.
    """
    venue = engine_result.get("venue", {})
    readiness = engine_result.get("readiness", {})
    evac = engine_result.get("evacuation", {})

    lines = [
        f"Stadium Analysis for {venue.get('name', 'Unknown')}",
        f"Readiness Grade: {readiness.get('grade', 'N/A')} "
        f"(Score: {readiness.get('score', 'N/A')})",
        f"Evacuation Time: {evac.get('evacuation_time_minutes', 'N/A')} minutes "
        f"({'Meets' if evac.get('meets_standard') else 'Exceeds'} "
        f"{evac.get('standard_minutes', 8)}-minute standard)",
    ]

    recommendations = readiness.get("recommendations", [])
    if recommendations:
        lines.append("Recommendations:")
        for rec in recommendations:
            lines.append(f"  • {rec}")

    return "\n".join(lines)


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
    settings = get_settings()

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

    if not settings.use_ai or not settings.gemini_api_key:
        logger.info(
            "AI disabled or no API key — using fallback",
            extra={"extra_data": {"reason": "ai_disabled_or_no_key"}},
        )
        return _build_fallback_text(engine_result), True

    prompt = (
        "You are StadiumIQ, a FIFA World Cup 2026 stadium operations analyst. "
        "Analyze the following stadium data and provide actionable insights "
        "in 3-5 concise paragraphs. Focus on safety, crowd management, and "
        "operational recommendations.\n\n"
        f"Data: {engine_result}"
    )

    try:
        client = _get_client()
        response: GenerateContentResponse = client.models.generate_content(
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

        _insight_cache[cache_key] = (text, time.time())
        return text, False

    except Exception as exc:
        logger.warning(
            "AI insight generation failed — using fallback",
            extra={
                "extra_data": {"reason": str(exc), "error_type": type(exc).__name__}
            },
        )
        return _build_fallback_text(engine_result), True


async def generate_fan_response(
    query: str,
    language: str,
    venue_context: dict[str, Any] | None,
) -> tuple[str, bool]:
    """Generate a multilingual fan-facing response to a query.

    Args:
        query: The fan's question.
        language: ISO language code for the response.
        venue_context: Optional venue data dict to provide context.

    Returns:
        A tuple of (response_text, fallback_used).
    """
    settings = get_settings()

    generic_fallback = (
        "Thank you for your question! For the latest information about "
        "FIFA World Cup 2026 venues, please visit the official FIFA website "
        "or contact the stadium's guest services team."
    )

    if not settings.use_ai or not settings.gemini_api_key:
        logger.info(
            "AI disabled or no API key — using fan-assist fallback",
            extra={"extra_data": {"reason": "ai_disabled_or_no_key"}},
        )
        return generic_fallback, True

    venue_info = ""
    if venue_context:
        venue_info = (
            f"\nVenue context: {venue_context.get('name', 'Unknown')} in "
            f"{venue_context.get('city', 'Unknown')}, capacity "
            f"{venue_context.get('capacity', 'Unknown')}."
        )

    prompt = (
        "You are a helpful FIFA World Cup 2026 fan assistant. "
        f"Respond in {language} language. Be friendly, concise, and accurate. "
        f"If you don't know something, say so honestly.{venue_info}\n\n"
        f"Fan question: {query}"
    )

    try:
        client = _get_client()
        response: GenerateContentResponse = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
        )
        text = response.text or ""
        text = _strip_json_fences(text)

        if not text:
            logger.warning(
                "AI returned empty fan response — using fallback",
                extra={"extra_data": {"reason": "empty_ai_response"}},
            )
            return generic_fallback, True

        return text, False

    except Exception as exc:
        logger.warning(
            "Fan-assist AI failed — using fallback",
            extra={
                "extra_data": {"reason": str(exc), "error_type": type(exc).__name__}
            },
        )
        return generic_fallback, True
