"""Shared helpers for the ai_service module.

All generation functions depend on these internal utilities.
"""

from __future__ import annotations

import logging
import re
from typing import TYPE_CHECKING, Any

from google import genai

from app.core.config import get_settings


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


def _is_safe_prompt(text: str) -> bool:
    """Basic security check to prevent obvious prompt injection."""
    suspicious_keywords = [
        "ignore all previous",
        "system prompt",
        "you are now",
        "forget everything",
        "bypass",
        "override"
    ]
    lower_text = text.lower()
    return not any(kw in lower_text for kw in suspicious_keywords)


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
    accessibility = engine_result.get("accessibility", {})
    waste = engine_result.get("waste_diversion", {})
    route = engine_result.get("route_recommendation", {})

    lines = [
        f"Stadium Analysis for {venue.get('name', 'Unknown')}",
        f"Readiness Grade: {readiness.get('grade', 'N/A')} "
        f"(Score: {readiness.get('score', 'N/A')})",
        f"Evacuation Time: {evac.get('evacuation_time_minutes', 'N/A')} minutes "
        f"({'Meets' if evac.get('meets_standard') else 'Exceeds'} "
        f"{evac.get('standard_minutes', 8)}-minute standard)",
        f"Accessibility: {'ADA Compliant' if accessibility.get('meets_ada') else 'Below Threshold'}",
        f"Sustainability Score: {min(100.0, (waste.get('diversion_rate_pct', 0.0) / 90.0) * 100):.1f}/100",
    ]

    if route and route.get("reason"):
        lines.append(f"Route Recommendation: {route.get('reason')}")

    recommendations = readiness.get("recommendations", [])
    if recommendations:
        lines.append("Recommendations:")
        for rec in recommendations:
            lines.append(f"  • {rec}")

    return "\n".join(lines)
