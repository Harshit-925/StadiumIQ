"""Transport route — POST /api/transport."""

from fastapi import APIRouter, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.schemas import TransportRequest, TransportResponse

router = APIRouter()


@router.post("/transport", response_model=TransportResponse)
@limiter.limit(RATE_LIMIT_AI)
async def get_transport(request: Request, body: TransportRequest) -> TransportResponse:
    """Multimodal transportation options with AI narrative."""
    from app.engine.transport import get_transport_options  # noqa: PLC0415
    from app.services.ai_service.transport import generate_transport_narrative  # noqa: PLC0415

    result = get_transport_options(body.accessible_only)
    
    narrative = await generate_transport_narrative(
        parking_options=result["parking"],
        transit_options=result["transit"],
    )
    
    result["ai_insights"] = narrative
    
    return TransportResponse(**result)
