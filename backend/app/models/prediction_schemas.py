"""Pydantic v2 schemas for the Prediction / trend endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class PredictionRequest(BaseModel):
    """Request body for ``POST /api/prediction/trend``."""

    historical_densities: list[float] = Field(
        ...,
        min_length=2,
        description="Ordered density readings (pax/m²), oldest first. Min 2 required.",
    )
    minutes_ahead: int = Field(
        ..., ge=1, le=120, description="Minutes ahead to project (1-120)"
    )
    current_queue: int = Field(
        default=0, ge=0, description="Current gate queue length (persons)"
    )
    arrival_rate: float = Field(
        default=1.0, gt=0, description="Arrivals per minute at the gate"
    )

    @field_validator("historical_densities")
    @classmethod
    def densities_in_valid_range(cls, v: list[float]) -> list[float]:
        """Ensure each density value is between 0 and 10 pax/m²."""
        for d in v:
            if d < 0 or d > 10:
                raise ValueError("Density values must be between 0 and 10 pax/m².")
        return v


class PredictionResponse(BaseModel):
    """Response body for ``POST /api/prediction/trend``."""

    projected_density: float = Field(
        description="Projected density (pax/m²) at the requested time horizon."
    )
    estimated_wait_minutes: int = Field(
        description="Estimated gate wait time in minutes."
    )
    minutes_ahead: int
    methodology_note: str = Field(
        default=(
            "Simple linear extrapolation and Little's Law — directional signal only, "
            "not a trained ML model."
        )
    )
