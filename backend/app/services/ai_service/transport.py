"""Generate executive narrative for transportation options."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from google import genai

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

    input_str = f"{parking_options} {transit_options}"
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

    from google.genai.types import GenerateContentConfig  # noqa: PLC0415

    async def _generate(client: genai.Client) -> str:
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

    from app.services.ai_service._shared import safe_ai_call
    return await safe_ai_call(input_str, fallback_brief, _generate, "transport")
