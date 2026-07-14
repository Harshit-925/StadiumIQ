"""Tests for the AI service module.

All tests mock the Gemini client — no live AI calls are made.
"""

from __future__ import annotations

from typing import Any
from unittest.mock import AsyncMock, MagicMock, patch

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

    def test_reports_actual_accessibility_compliance(self) -> None:
        """Checks accessibility logic against real Engine key."""
        result = {**SAMPLE_ENGINE_RESULT, "accessibility": {"meets_ada": True}}
        text = _build_fallback_text(result)
        assert "ADA Compliant" in text

    def test_reports_real_sustainability_score(self) -> None:
        """Checks sustainability logic against real Engine key."""
        result = {**SAMPLE_ENGINE_RESULT, "waste_diversion": {"diversion_rate_pct": 90.0}}
        text = _build_fallback_text(result)
        assert "100.0/100" in text


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
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert text == "Great analysis of stadium conditions."
        assert fallback is False

    async def test_fallback_on_exception(self) -> None:
        """When AI raises, returns fallback text with fallback_used=True."""
        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(side_effect=RuntimeError("API down"))

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
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
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_crowd_insights(SAMPLE_ENGINE_RESULT)

        assert fallback is True

    async def test_fallback_when_ai_disabled(self) -> None:
        """When use_ai=False, returns fallback immediately."""
        with patch("app.services.ai_service._shared.get_settings") as mock_settings:
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
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
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
        mock_client.aio.models.generate_content = AsyncMock(side_effect=ConnectionError("offline"))

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
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
        mock_client.aio.models.generate_content = AsyncMock(return_value=mock_response)

        venue_ctx = {"name": "Estadio Azteca", "city": "Mexico City", "capacity": 83000}

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"

            text, fallback = await generate_fan_response(
                "Tell me about the venue", "es", venue_ctx
            )

        assert fallback is False
        # Verify the prompt included venue context
        call_args = mock_client.aio.models.generate_content.call_args
        prompt = call_args.kwargs.get("contents") or call_args[1].get("contents", "")
        assert "Azteca" in str(prompt)

    async def test_fallback_when_no_api_key(self) -> None:
        """No API key → immediate fallback."""
        with patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = ""

            text, fallback = await generate_fan_response("Hello", "en", None)

        assert fallback is True


# ─────────────────────────────────────────────────────────────────────────────
# Emergency AI service — fallback path coverage
# ─────────────────────────────────────────────────────────────────────────────

class TestEmergencyAIFallback:
    """Covers the emergency.py fallback paths (67% → target ~90%)."""

    TRIAGE = {
        "priority_level": "HIGH",
        "action_plan": ["Evacuate zone", "Call medical"],
        "requires_police": False,
        "requires_medical": True,
    }

    async def test_fallback_when_client_is_none(self) -> None:
        """No client → immediate deterministic fallback."""
        from app.services.ai_service.emergency import generate_emergency_brief

        with patch(
            "app.services.ai_service._shared._get_client", return_value=None
        ):
            result = await generate_emergency_brief(
                "medical", 3, "north_stand", self.TRIAGE
            )

        assert "medical" in result.lower() or "north_stand" in result.lower()

    async def test_fallback_on_exception(self) -> None:
        """When AI raises RuntimeError, returns fallback string."""
        from app.services.ai_service.emergency import generate_emergency_brief

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            side_effect=RuntimeError("API down")
        )

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ):
            result = await generate_emergency_brief(
                "fire", 5, "gate_a", self.TRIAGE
            )

        # Should return the fallback brief, not raise
        assert isinstance(result, str)
        assert len(result) > 0

    async def test_fallback_on_empty_response(self) -> None:
        """Empty AI response triggers fallback."""
        from app.services.ai_service.emergency import generate_emergency_brief

        mock_response = MagicMock()
        mock_response.text = ""

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            return_value=mock_response
        )

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ):
            result = await generate_emergency_brief(
                "crowd_crush", 4, "section_c", self.TRIAGE
            )

        assert isinstance(result, str)

    async def test_success_returns_ai_text(self) -> None:
        """When AI succeeds, return the AI-generated brief."""
        from app.services.ai_service.emergency import generate_emergency_brief

        mock_response = MagicMock()
        mock_response.text = "Security teams have been dispatched to Gate A."

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            return_value=mock_response
        )

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"
            result = await generate_emergency_brief(
                "violence", 2, "gate_a", self.TRIAGE
            )

        assert result == "Security teams have been dispatched to Gate A."


# ─────────────────────────────────────────────────────────────────────────────
# Navigation AI service — fallback path coverage
# ─────────────────────────────────────────────────────────────────────────────

class TestNavigationAIFallback:
    """Covers the navigation.py fallback paths (77% → target ~90%)."""

    ROUTE_RESULT = {
        "path": ["gate_a", "concourse_n", "section_101"],
        "steps": [
            {"from": "gate_a", "to": "concourse_n", "minutes": 3},
            {"from": "concourse_n", "to": "section_101", "minutes": 2},
        ],
        "total_minutes": 5,
        "accessible": True,
    }

    async def test_fallback_when_client_is_none(self) -> None:
        """No client → immediate deterministic fallback."""
        from app.services.ai_service.navigation import generate_navigation_narrative

        with patch(
            "app.services.ai_service._shared._get_client", return_value=None
        ):
            narrative, source = await generate_navigation_narrative(self.ROUTE_RESULT)

        assert source == "fallback"
        assert "5 minutes" in narrative

    async def test_fallback_on_exception(self) -> None:
        """When AI raises RuntimeError, returns fallback narrative."""
        from app.services.ai_service.navigation import generate_navigation_narrative

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            side_effect=RuntimeError("API down")
        )

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ):
            narrative, source = await generate_navigation_narrative(self.ROUTE_RESULT)

        assert source == "fallback"
        assert isinstance(narrative, str)

    async def test_fallback_on_empty_path(self) -> None:
        """Empty path → immediate fallback before any client call."""
        from app.services.ai_service.navigation import generate_navigation_narrative

        empty_route = {**self.ROUTE_RESULT, "path": [], "steps": []}
        narrative, source = await generate_navigation_narrative(empty_route)

        assert source == "fallback"
        assert "No route" in narrative

    async def test_success_returns_ai_narrative(self) -> None:
        """When AI succeeds, returns AI narrative with source 'genai'."""
        from app.services.ai_service.navigation import generate_navigation_narrative

        mock_response = MagicMock()
        mock_response.text = "Head to Gate A, then follow signs to Section 101."

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            return_value=mock_response
        )

        with patch(
            "app.services.ai_service._shared._get_client", return_value=mock_client
        ), patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"
            narrative, source = await generate_navigation_narrative(
                self.ROUTE_RESULT, language="en"
            )

        assert source == "genai"
        assert narrative == "Head to Gate A, then follow signs to Section 101."


# ─────────────────────────────────────────────────────────────────────────────
# Transport AI service — fallback path coverage
# ─────────────────────────────────────────────────────────────────────────────

class TestTransportAIFallback:
    """Covers the transport.py fallback paths."""

    PARKING_OPTIONS = [{"name": "Lot A", "walk_time_mins": 5, "occupancy_pct": 20}]
    TRANSIT_OPTIONS = [{"name": "Bus 101", "status": "On time"}]

    async def test_fallback_when_client_is_none(self) -> None:
        """No client → immediate deterministic fallback."""
        from app.services.ai_service.transport import generate_transport_narrative

        with patch("app.services.ai_service._shared._get_client", return_value=None):
            result = await generate_transport_narrative(self.PARKING_OPTIONS, self.TRANSIT_OPTIONS)

        assert "Lot A" in result

    async def test_fallback_on_exception(self) -> None:
        """When AI raises RuntimeError, returns fallback narrative."""
        from app.services.ai_service.transport import generate_transport_narrative

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            side_effect=RuntimeError("API down")
        )

        with patch("app.services.ai_service._shared._get_client", return_value=mock_client):
            result = await generate_transport_narrative(self.PARKING_OPTIONS, self.TRANSIT_OPTIONS)

        assert "Lot A" in result

    async def test_fallback_on_empty_response(self) -> None:
        """Empty AI response triggers fallback."""
        from app.services.ai_service.transport import generate_transport_narrative

        mock_response = MagicMock()
        mock_response.text = ""

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            return_value=mock_response
        )

        with patch("app.services.ai_service._shared._get_client", return_value=mock_client), \
             patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"
            result = await generate_transport_narrative(self.PARKING_OPTIONS, self.TRANSIT_OPTIONS)

        assert "Lot A" in result

    async def test_success_returns_ai_narrative(self) -> None:
        """When AI succeeds, returns AI narrative."""
        from app.services.ai_service.transport import generate_transport_narrative

        mock_response = MagicMock()
        mock_response.text = "Park in Lot A, it's very close."

        mock_client = MagicMock()
        mock_client.aio.models.generate_content = AsyncMock(
            return_value=mock_response
        )

        with patch("app.services.ai_service._shared._get_client", return_value=mock_client), \
             patch("app.services.ai_service._shared.get_settings") as mock_settings:
            mock_settings.return_value.use_ai = True
            mock_settings.return_value.gemini_api_key = "test-key"
            result = await generate_transport_narrative(self.PARKING_OPTIONS, self.TRANSIT_OPTIONS)

        assert result == "Park in Lot A, it's very close."

