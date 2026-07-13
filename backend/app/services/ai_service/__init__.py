"""Gemini AI service — generates narrative insights and fan-facing responses.

Uses the google-genai SDK with ``gemini-2.5-flash``.  Every public function
follows a *never-crash* contract: on any exception the function returns a
deterministic fallback string and ``fallback_used=True``.

This package is a re-export shim: all public names from the submodules are
re-exported here so that existing imports (``from app.services.ai_service
import generate_crowd_insights``) and mock.patch targets
(``app.services.ai_service._get_client``) continue to work unchanged.
"""

from app.services.ai_service._shared import (
    CACHE_TTL_SECONDS,
    _build_fallback_text,
    _client,
    _get_client,
    _insight_cache,
    _is_safe_prompt,
    _strip_json_fences,
)
from app.services.ai_service.crowd_insights import generate_crowd_insights
from app.services.ai_service.emergency import generate_emergency_brief
from app.services.ai_service.fan_assist import generate_fan_response
from app.services.ai_service.navigation import generate_navigation_narrative

__all__ = [
    # Shared helpers (re-exported so test imports & mock.patch targets resolve)
    "_client",
    "_get_client",
    "_is_safe_prompt",
    "_strip_json_fences",
    "_build_fallback_text",
    "_insight_cache",
    "CACHE_TTL_SECONDS",
    # Generation functions
    "generate_crowd_insights",
    "generate_fan_response",
    "generate_navigation_narrative",
    "generate_emergency_brief",
]
