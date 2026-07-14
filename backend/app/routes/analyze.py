"""Stadium analysis route — POST /api/analyze."""

import logging
from datetime import UTC, datetime
from typing import Any

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Request

from app.core.auth import get_optional_user
from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.engine.calculator import analyze_venue
from app.models.schemas import VenueAnalysisRequest, VenueAnalysisResponse
from app.services import ai_service, supabase_client

logger = logging.getLogger("stadiumiq")

router = APIRouter()


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
        route_rec = engine_result.get("route_recommendation", {})
        evacuation = engine_result.get("evacuation", {})
        accessibility = engine_result.get("accessibility", {})
        waste = engine_result.get("waste_diversion", {})
        venue_info = engine_result.get("venue", {})
        zone_analyses_raw = engine_result.get("zone_analyses", [])

        # Build zone_analyses in the shape the frontend expects
        zone_analyses_out: list[dict[str, Any]] = []
        for z in zone_analyses_raw:
            classif = z.get("classification", {})
            level = classif.get("level", "safe")
            zone_analyses_out.append(
                {
                    "zone_id": z.get("zone_id", ""),
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
                sum(float(z["density"]) for z in zone_analyses_out) / len(zone_analyses_out)
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
            "route_recommendation": {
                "recommended_zone_id": route_rec.get("recommended_zone_id"),
                "recommended_zone_density": route_rec.get("recommended_zone_density"),
                "reason": route_rec.get("reason", ""),
            },
        })

    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except HTTPException:
        raise
