"""Transport route — POST /api/transport."""

from __future__ import annotations

from fastapi import APIRouter, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.schemas import TransportRequest, TransportResponse

router = APIRouter()


@router.post("/transport", response_model=TransportResponse)
@limiter.limit(RATE_LIMIT_AI)
async def get_transport(request: Request, body: TransportRequest) -> TransportResponse:
    """Multimodal transportation options."""
    from app.engine.transport import get_transport_options  # noqa: PLC0415

    result = get_transport_options(body.accessible_only)
    return TransportResponse(**result)
