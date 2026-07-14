"""Generate quick executive briefs for emergency incidents."""

from __future__ import annotations

import logging
from typing import Any



logger = logging.getLogger("stadiumiq")


async def generate_emergency_brief(
    incident_type: str,
    severity: int,
    zone: str,
    triage_result: dict[str, Any]
) -> str:
    """Generate a quick executive brief for an emergency incident."""
    fallback_brief = f"Incident: {incident_type} in {zone}. Priority: {triage_result['priority_level']}."

    input_str = f"{incident_type} {zone} {triage_result}"
    prompt = f"""
You are a StadiumIQ security operations assistant.
Write a 2-sentence executive brief for the following incident:
Type: {incident_type}
Severity: {severity}/5
Zone: {zone}
Action Plan: {', '.join(triage_result['action_plan'])}

Rules:
1. Be extremely concise and professional.
2. State the incident clearly.
3. Summarize the response action.
"""

    from google import genai  # noqa: PLC0415
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
    return await safe_ai_call(input_str, fallback_brief, _generate, "emergency")
