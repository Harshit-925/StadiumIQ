"""Generate friendly narrative overlays for navigation routes."""

from __future__ import annotations

import logging
from typing import Any

from app.services.ai_service._shared import (
    _get_client,
    _is_safe_prompt,
)

logger = logging.getLogger("stadiumiq")


async def generate_navigation_narrative(
    route_result: dict[str, Any],
    language: str = "en"
) -> tuple[str, str]:
    """Generate a friendly narrative overlay for a navigation route.

    Args:
        route_result: The dictionary returned by find_route.
        language: Language code.

    Returns:
        Tuple of (narrative_text, source).
    """
    if not route_result["path"]:
        return ("No route found.", "fallback")

    steps_text = []
    from app.data.venue_graph import zone_display_name  # noqa: PLC0415
    for s in route_result["steps"]:
        steps_text.append(f"- From {zone_display_name(s['from'])} to {zone_display_name(s['to'])} ({s['minutes']} min)")
    steps_str = "\n".join(steps_text)

    fallback_narrative = (
        f"Your route will take approximately {route_result['total_minutes']} minutes. "
        "Please follow the steps provided."
    )

    client = _get_client()
    if not client:
        return (fallback_narrative, "fallback")

    if not _is_safe_prompt(steps_str):
        logger.warning("Prompt injection attempt detected in navigation input.")
        return (fallback_narrative, "fallback")

    prompt = f"""
You are a friendly StadiumIQ assistant.
Convert the following route steps into a warm, 2-4 sentence narrative guide.
The total walk time is {route_result['total_minutes']} minutes.
Is this an accessible (step-free) route? {'Yes' if route_result['accessible'] else 'No'}.

Raw steps:
{steps_str}

Rules:
1. Be concise, polite, and helpful.
2. DO NOT invent landmarks not in the steps.
3. If accessible is True, reassure them it is step-free.
4. Provide the answer in language code: {language}.
"""
    try:
        from google.genai.types import GenerateContentConfig  # noqa: PLC0415
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.3,
                max_output_tokens=300,
            ),
        )
        if response and response.text:
            return (response.text.strip(), "genai")
        return (fallback_narrative, "fallback")
    except Exception as e:
        logger.error(f"Error generating navigation narrative: {e}")
        return (fallback_narrative, "fallback")
