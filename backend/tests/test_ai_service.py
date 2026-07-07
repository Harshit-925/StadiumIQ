"""Tests for the AI service module.

All tests mock the Gemini client — no live AI calls are made.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import MagicMock, patch

from app.services.ai_service import (
    _build_fallback_text,
    _strip_json_fences,
    generate_crowd_insights,
    generate_fan_response,
)

# ── Shared test data ────────────────────────────────────────────────────

SAMPLE_ENGINE_RESULT: dict[str, Any] = {
    "venue": {"name": "MetLife Stadium", "city": "New York/NJ", "capacity": 82500},
    "readiness": {"grade": "C", "score": 72.5, "recommendations": ["Improve exits"]},
    "evacuation": {
        "evacuation_time_minutes": 22.36,
        "meets_standard": False,
        "standard_minutes": 8,
    },
}


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  HELPER TESTS                                                         ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestStripJsonFences:
    """Tests for the fence-stripping helper."""

    def test_removes_json_fences(self) -> None:
        """Strips ```json ... ``` wrappers."""
        assert _strip_json_fences('```json\n{"key": "val"}\n```') == '{"key": "val"}'

    def test_removes_plain_fences(self) -> None:
        """Strips bare ``` ... ``` wrappers."""
        assert _strip_json_fences("```\nhello\n```") == "hello"

    def test_passthrough_clean_text(self) -> None:
        """Clean text passes through unchanged."""
        assert _strip_json_fences("hello world") == "hello world"


class TestBuildFallbackText:
    """Tests for deterministic fallback text builder."""

    def test_includes_venue_name(self) -> None:
        """Fallback text should include the venue name."""
        text = _build_fallback_text(SAMPLE_ENGINE_RESULT)
        assert "MetLife Stadium" in text

    def test_includes_grade(self) -> None:
        """Fallback text should include the grade."""
        text = _build_fallback_text(SAMPLE_ENGINE_RESULT)
        assert "C" in text

    def test_includes_recommendations(self) -> None:
        """Fallback text should include recommendations."""
        text = _build_fallback_text(SAMPLE_ENGINE_RESULT)
        assert "Improve exits" in text


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  generate_crowd_insights                                               ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestGenerateCrowdInsights:
    """Tests for the crowd-insights AI wrapper."""

    async def test_success_returns_ai_text(self) -> None:
        """When AI succeeds, returns AI text with fallback_used=False."""
        mock_response = MagicMock()
        mock_response.text = "Great analysis of stadium conditions."

        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert text == "Great analysis of stadium conditions."
        assert fallback is False

    async def test_fallback_on_exception(self) -> None:
        """When AI raises, returns fallback text with fallback_used=True."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = RuntimeError("API down")

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert fallback is True
        assert "MetLife Stadium" in text  # fallback contains venue name

    async def test_fallback_on_empty_response(self) -> None:
        """Empty AI response triggers fallback."""
        mock_response = MagicMock()
        mock_response.text = ""

        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert fallback is True

    async def test_fallback_when_ai_disabled(self) -> None:
        """When use_ai=False, returns fallback immediately."""
        with patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = False
            mock_settings.return_value.gemini_api_key = ""

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert fallback is True
        assert "MetLife Stadium" in text


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  generate_fan_response                                                 ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class TestGenerateFanResponse:
    """Tests for the fan Q&A AI wrapper."""

    async def test_success(self) -> None:
        """Successful AI response returns text, fallback_used=False."""
        mock_response = MagicMock()
        mock_response.text = "Gates open 3 hours before kickoff."

        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_fan_response(
                "When do gates open?", "en", None
            )

        assert text == "Gates open 3 hours before kickoff."
        assert fallback is False

    async def test_fallback_on_exception(self) -> None:
        """AI failure → generic fallback with fallback_used=True."""
        mock_client = MagicMock()
        mock_client.models.generate_content.side_effect = ConnectionError("offline")

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_fan_response("Hello", "en", None)

        assert fallback is True
        assert "FIFA World Cup 2026" in text

    async def test_with_venue_context(self) -> None:
        """Venue context is passed to the AI prompt."""
        mock_response = MagicMock()
        mock_response.text = "Estadio Azteca info..."

        mock_client = MagicMock()
        mock_client.models.generate_content.return_value = mock_response

        venue_ctx = {"name": "Estadio Azteca", "city": "Mexico City", "capacity": 83000}

        with patch(
            "app.services.ai_service._get_client", return_value=mock_client
        ), patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_fan_response(
                "Tell me about the venue", "es", venue_ctx
            )

        assert fallback is False
        # Verify the prompt included venue context
        call_args = mock_client.models.generate_content.call_args
        prompt = call_args.kwargs.get("contents") or call_args[1].get("contents", "")
        assert "Azteca" in str(prompt)

    async def test_fallback_when_no_api_key(self) -> None:
        """No API key → immediate fallback."""
        with patch("app.services.ai_service.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = ""

            text, fallback = await generate_fan_response("Hello", "en", None)

        assert fallback is True
