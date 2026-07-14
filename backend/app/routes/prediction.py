"""Prediction route — POST /api/prediction/trend."""

from fastapi import APIRouter, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.schemas import PredictionRequest, PredictionResponse

router = APIRouter()


@router.post("/prediction/trend", response_model=PredictionResponse)
@limiter.limit(RATE_LIMIT_AI)
async def predict_trend(
    request: Request, body: PredictionRequest
) -> PredictionResponse:
    """Project crowd density and gate wait time forward using simple extrapolation.

    Uses weighted linear trend projection and Little's Law queuing estimate.
    No I/O, always returns a result. See engine docstrings for model limitations.
    """
    from app.engine.prediction import (  # noqa: PLC0415
        predict_crowd_trend,
        predict_wait_time,
    )

    projected_density = predict_crowd_trend(
        body.historical_densities, body.minutes_ahead
    )

    estimated_wait = 0
    if body.current_queue > 0:
        estimated_wait = predict_wait_time(body.current_queue, body.arrival_rate)

    return PredictionResponse(
        projected_density=projected_density,
        estimated_wait_minutes=estimated_wait,
        minutes_ahead=body.minutes_ahead,
    )
