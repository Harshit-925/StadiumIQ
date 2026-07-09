"""API route definitions for StadiumIQ.

Routes:
- GET  /api/health    — health check (no auth, no rate limit)
- POST /api/analyze   — stadium analysis (auth + 10/min rate limit)
- POST /api/fan-assist — fan Q&A assistant (no auth required, 5/min per-IP limit)
"""


import logging
from datetime import UTC, datetime
from typing import Any

import httpx
from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.core.auth import get_optional_user
from app.core.config import get_settings
from app.core.rate_limit import (
    RATE_LIMIT_AI,
    RATE_LIMIT_FAN_ASSIST_AUTH,
    RATE_LIMIT_FAN_ASSIST_PUBLIC,
    _fan_assist_key,
    limiter,
)
from app.engine.calculator import analyze_venue, get_venue_info
from app.models.schemas import (
    FanAssistRequest,
    FanAssistResponse,
    HealthResponse,
    VenueAnalysisRequest,
    VenueAnalysisResponse,
)
from app.services import ai_service, supabase_client

logger = logging.getLogger("stadiumiq")

router = APIRouter(prefix="/api", tags=["StadiumIQ"])


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  HEALTH                                                                ║
# ╚══════════════════════════════════════════════════════════════════════════╝


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


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  ANALYZE                                                               ║
# ╚══════════════════════════════════════════════════════════════════════════╝


@router.post("/analyze", response_model=VenueAnalysisResponse)
@limiter.limit(RATE_LIMIT_AI)
async def analyze(
    request: Request,
    background_tasks: BackgroundTasks,
    body: VenueAnalysisRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> VenueAnalysisResponse:
    """Run a full stadium operations analysis.

    Pipeline: engine → AI insights → Supabase save → response.

    Args:
        request: The Starlette request (needed by slowapi).
        body: Validated request body.
        user: Decoded Supabase JWT payload (or None if unauthenticated).

    Returns:
        VenueAnalysisResponse with engine results, AI insights, and grade.
    """
    try:
        # 1. Deterministic engine
        engine_result = analyze_venue(
            venue_id=body.venue_id,
            zone_densities=body.zone_densities,
            waste_recycled_kg=body.waste_recycled_kg,
            waste_total_kg=body.waste_total_kg,
            spectator_count=body.spectator_count,
            risk_level=body.risk_level,
        )

        # 2. AI insights (never crashes)
        ai_text, fallback_used = await ai_service.generate_crowd_insights(engine_result)

        # 3. Persist to Supabase (fire-and-forget via FastAPI BackgroundTasks)
        if user:
            user_id: str = user.get("sub", "")
            if user_id:
                background_tasks.add_task(
                    supabase_client.save_result,
                    user_id=user_id,
                    venue_id=body.venue_id,
                    engine_result=engine_result,
                    ai_result={"text": ai_text},
                    fallback_used=fallback_used,
                )

        readiness = engine_result.get("readiness", {})
        evacuation = engine_result.get("evacuation", {})
        accessibility = engine_result.get("accessibility", {})
        waste = engine_result.get("waste_diversion", {})
        venue_info = engine_result.get("venue", {})
        zone_analyses_raw = engine_result.get("zone_analyses", [])

        # Build zone_analyses in the shape the frontend expects
        zone_analyses_out = []
        for i, z in enumerate(zone_analyses_raw):
            classif = z.get("classification", {})
            level = classif.get("level", "safe")
            zone_analyses_out.append(
                {
                    "zone_id": z.get("zone_index", i) + 1,
                    "density": z.get("density_pax_per_sqm", 0.0),
                    "classification": {
                        "level": level,
                        "description": classif.get("description", ""),
                        # Engine stores this as a string; convert to bool for Pydantic
                        "action_required": level != "safe",
                        "color": classif.get("color", "green"),
                    },
                }
            )

        return VenueAnalysisResponse(**{
            "venue": venue_info.get("name", body.venue_id),
            "timestamp": datetime.now(UTC).isoformat(),
            "overall_grade": readiness.get("grade", "N/A"),
            "crowd_score": readiness.get("score", 0.0),
            "average_density": (
                sum(z["density"] for z in zone_analyses_out) / len(zone_analyses_out)
                if zone_analyses_out
                else 0.0
            ),
            "zone_analyses": zone_analyses_out,
            "evacuation_time_minutes": evacuation.get("evacuation_time_minutes", 0.0),
            "evacuation_feasible": evacuation.get("meets_standard", False),
            "accessibility_compliance": accessibility.get("meets_ada", False),
            "wheelchair_ratio": accessibility.get("ratio", 0.0),
            "sustainability_score": min(
                100.0, (waste.get("diversion_rate_pct", 0.0) / 90.0) * 100
            ),
            "recycling_rate": waste.get("diversion_rate_pct", 0.0) / 100.0,
            "ai_insights": ai_text,
            "ai_fallback": fallback_used,
        })

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /api/analyze")
        raise HTTPException(
            status_code=500,
            detail="Internal server error. Please try again later.",
        ) from exc


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  FAN ASSIST                                                            ║
# ╚══════════════════════════════════════════════════════════════════════════╝


@router.post("/fan-assist", response_model=FanAssistResponse)
@limiter.limit(RATE_LIMIT_FAN_ASSIST_AUTH, key_func=_fan_assist_key)  # 10/min authenticated
@limiter.limit(RATE_LIMIT_FAN_ASSIST_PUBLIC)  # 5/min anonymous (IP fallback)
async def fan_assist(
    request: Request,
    body: FanAssistRequest,
    user: dict[str, Any] | None = Depends(get_optional_user),
) -> FanAssistResponse:
    """AI-powered fan question-and-answer assistant.

    This endpoint is **public** — no authentication is required, so fans can
    use it without logging in. A strict per-IP rate limit of 5 requests/minute
    applies to prevent abuse.

    Authenticated operators receive the same response; the ``user`` dependency
    is optional and used only for contextual logging if present.

    Args:
        request: The Starlette request (needed by slowapi).
        body: Validated request body.
        user: Optional authenticated user record from Supabase.

    Returns:
        FanAssistResponse with the assistant's reply.
    """
    try:
        venue_context = None
        if body.venue_id:
            try:
                venue_context = get_venue_info(body.venue_id)
            except ValueError:
                pass  # non-critical — proceed without venue context

        text, fallback_used = await ai_service.generate_fan_response(
            query=body.query,
            language=body.language,
            venue_context=venue_context,
        )

        source = "gemini-2.5-flash" if not fallback_used else "fallback"

        return FanAssistResponse(
            response=text,
            language=body.language,
            source=source,
            fallback_used=fallback_used,
        )

    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("Unexpected error in /api/fan-assist")
        raise HTTPException(
            status_code=500,
            detail="Internal server error. Please try again later.",
        ) from exc
