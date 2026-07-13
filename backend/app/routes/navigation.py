"""Navigation route — POST /api/navigate."""

from __future__ import annotations

import logging

from fastapi import APIRouter, HTTPException, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.schemas import NavigationRequest, NavigationResponse, NavigationStep
from app.services import ai_service

logger = logging.getLogger("stadiumiq")

router = APIRouter()


@router.post("/navigate", response_model=NavigationResponse)
@limiter.limit(RATE_LIMIT_AI)
async def navigate(request: Request, body: NavigationRequest) -> NavigationResponse:
    """AI-powered stadium navigation."""
    from app.data.venue_graph import zone_display_name  # noqa: PLC0415
    from app.engine.navigation import find_route  # noqa: PLC0415

    result = find_route(body.origin, body.destination, body.accessible_only)
    if not result["path"]:
        raise HTTPException(status_code=404, detail="No route found between those zones")

    narrative, source = await ai_service.generate_navigation_narrative(result, body.language)

    steps = [
        NavigationStep(
            instruction=f"From {zone_display_name(s['from'])}, proceed to {zone_display_name(s['to'])}.",
            zone=s["to"],
            minutes=s["minutes"],
        ) for s in result["steps"]
    ]

    return NavigationResponse(
        steps=steps,
        total_minutes=result["total_minutes"],
        accessible=result["accessible"],
        narrative=narrative,
        source=source,
    )
