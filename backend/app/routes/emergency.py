"""Emergency triage route — POST /api/emergency."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.schemas import EmergencyRequest, EmergencyResponse
from app.services import ai_service

router = APIRouter()


@router.post("/emergency", response_model=EmergencyResponse)
@limiter.limit(RATE_LIMIT_AI)
async def triage_incident_endpoint(request: Request, body: EmergencyRequest) -> EmergencyResponse:
    """AI incident triage and response."""
    from app.engine.emergency import triage_incident  # noqa: PLC0415

    result = triage_incident(body.incident_type, body.severity, body.zone, body.zone_density)
    brief = await ai_service.generate_emergency_brief(
        body.incident_type, body.severity, body.zone, result
    )
    result["ai_brief"] = brief
    return EmergencyResponse(**result)
