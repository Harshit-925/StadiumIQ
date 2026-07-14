"""Generate executive narrative for transportation options."""

from __future__ import annotations

import logging
from typing import Any

from app.services.ai_service._shared import (
    _get_client,
    _is_safe_prompt,
)

logger = logging.getLogger("stadiumiq")


async def generate_transport_narrative(
    parking_options: list[dict[str, Any]],
    transit_options: list[dict[str, Any]],
) -> str:
    """Generate a quick executive brief recommending the best transport options."""
    fallback_brief = "Review ranked parking and transit options below."

    if parking_options:
        top_parking = parking_options[0]
        fallback_brief = f"Recommended Parking: {top_parking['name']} ({top_parking['walk_time_mins']} min walk, {top_parking['occupancy_pct']}% full)."

    from app.core.config import get_settings

    settings = get_settings()
    if not settings.use_ai or not settings.gemini_api_key:
        return fallback_brief

    client = _get_client()
    if not client:
        return fallback_brief

    input_str = f"{parking_options} {transit_options}"
    if not _is_safe_prompt(input_str):
        logger.warning("Prompt injection attempt detected in transport input.")
        return fallback_brief

    prompt = f"""
You are a StadiumIQ transport assistant.
Write a 1-2 sentence executive recommendation for fans based on the following sorted options:

Top Parking: {parking_options[:2] if parking_options else 'None'}
Top Transit: {transit_options[:2] if transit_options else 'None'}

Rules:
1. Be extremely concise and conversational.
2. Recommend the best parking option based on shortest walk and lowest occupancy.
3. Mention the best transit option if available.
"""
    try:
        from google.genai.types import GenerateContentConfig  # noqa: PLC0415
        response = await client.aio.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=GenerateContentConfig(
                temperature=0.2,
                max_output_tokens=150,
            ),
        )
        if response and response.text:
            text = response.text
            if isinstance(text, str):
                return text.strip()
            return str(text).strip()
        return fallback_brief
    except Exception as e:
        logger.error(f"Error generating transport brief: {e}")
        return fallback_brief
