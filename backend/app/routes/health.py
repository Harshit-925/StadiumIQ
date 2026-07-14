"""Health check route."""

import httpx
from fastapi import APIRouter

from app.core.config import get_settings
from app.models.schemas import HealthResponse

router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    """Health-check endpoint — pings Supabase REST API connectivity.

    Returns:
        HealthResponse with overall status, Supabase status, and version.
    """
    settings = get_settings()
    supabase_status = "unknown"

    if settings.supabase_url:
        try:
            async with httpx.AsyncClient(timeout=5.0) as client:
                resp = await client.get(
                    f"{settings.supabase_url}/rest/v1/",
                    headers={"apikey": settings.supabase_service_role_key},
                )
            supabase_status = "healthy" if resp.status_code in (200, 400) else "unhealthy"
        except httpx.HTTPError:
            supabase_status = "unreachable"
    else:
        supabase_status = "not_configured"

    overall = "healthy" if supabase_status in ("healthy", "not_configured") else "degraded"

    return HealthResponse(
        status=overall,
        supabase=supabase_status,
        version=settings.app_version,
    )
