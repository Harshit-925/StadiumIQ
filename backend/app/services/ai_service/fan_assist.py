"""Generate multilingual fan-facing responses to queries."""

from __future__ import annotations

import logging
from typing import TYPE_CHECKING, Any

if TYPE_CHECKING:
    from google import genai
    from google.genai.types import GenerateContentResponse


from app.services.ai_service._shared import (
    _strip_json_fences,
)

logger = logging.getLogger("stadiumiq")


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
    generic_fallback = (
        "Thank you for your question! For the latest information about "
        "FIFA World Cup 2026 venues, please visit the official FIFA website "
        "or contact the stadium's guest services team."
    )

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
        "IMPORTANT: Do not start your response with greetings like 'Hi', 'Hello', or 'Thanks for asking'. "
        "Get straight to the answer since this is an ongoing chat interface. "
        f"If you don't know something, say so honestly.{venue_info}\n\n"
        f"Fan question: {query}"
    )

    async def _generate(client: genai.Client) -> tuple[str, bool]:
        response: GenerateContentResponse = await client.aio.models.generate_content(
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

    from app.services.ai_service._shared import safe_ai_call
    return await safe_ai_call(query, (generic_fallback, True), _generate, "fan_assist")
