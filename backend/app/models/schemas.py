"""Pydantic v2 request/response schemas for StadiumIQ API.

All models use strict validation with Field constraints and custom validators.
"""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator

from app.engine.calculator import VENUES

# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  REQUEST MODELS                                                        ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class VenueAnalysisRequest(BaseModel):
    """Request body for ``POST /api/analyze``.

    Attributes:
        venue_id: Slug of a valid FIFA WC 2026 venue.
        zone_densities: List of density readings (pax/m²), one per zone.
        waste_recycled_kg: Recycled waste in kilograms.
        waste_total_kg: Total waste generated in kilograms (must be > 0).
    """

    venue_id: str = Field(..., description="Venue identifier string")
    zone_densities: dict[str, float] = Field(
        ...,
        description="Map of zone_id to density in pax/m²",
    )
    waste_recycled_kg: float = Field(..., ge=0, description="Recycled waste (kg)")
    waste_total_kg: float = Field(..., gt=0, description="Total waste (kg)")

    @field_validator("venue_id")
    @classmethod
    def venue_must_exist(cls, v: str) -> str:
        """Ensure the venue ID is one of the 16 known FIFA WC 2026 venues."""
        if v.lower() not in VENUES:
            valid = ", ".join(sorted(VENUES.keys()))
            raise ValueError(f"Unknown venue '{v}'. Valid venues: {valid}")
        return v.lower()

    @field_validator("zone_densities")
    @classmethod
    def densities_in_range(cls, v: dict[str, float]) -> dict[str, float]:
        """Ensure each density value is between 0 and 10 pax/m²."""
        for d in v.values():
            if d < 0 or d > 10:
                raise ValueError("Densities must be between 0 and 10 pax/m²")
        return v


class FanAssistRequest(BaseModel):
    """Request body for ``POST /api/fan-assist``.

    Attributes:
        query: The fan's question (1-500 chars).
        language: ISO language code, default ``"en"``.
        venue_id: Optional venue slug for contextual answers.
    """

    query: str = Field(..., min_length=1, max_length=500, description="Fan question")
    language: str = Field(default="en", description="ISO language code")
    venue_id: str | None = Field(default=None, description="Optional venue for context")

    @field_validator("venue_id")
    @classmethod
    def venue_must_exist_if_given(cls, v: str | None) -> str | None:
        """Validate venue_id when provided."""
        if v is not None and v.lower() not in VENUES:
            valid = ", ".join(sorted(VENUES.keys()))
            raise ValueError(f"Unknown venue '{v}'. Valid venues: {valid}")
        return v.lower() if v is not None else None


# ╔══════════════════════════════════════════════════════════════════════════╗
# ║  RESPONSE MODELS                                                       ║
# ╚══════════════════════════════════════════════════════════════════════════╝


class CrowdClassification(BaseModel):
    """Classification level for a crowd density reading."""

    level: str
    description: str
    action_required: bool
    color: str


class ZoneAnalysis(BaseModel):
    """Per-zone crowd density analysis."""

    zone_id: str
    density: float
    classification: CrowdClassification


class RouteRecommendation(BaseModel):
    """Recommended gate/zone for navigation and transportation guidance."""

    recommended_zone_id: str | None
    recommended_zone_density: float | None
    reason: str


class VenueAnalysisResponse(BaseModel):
    """Response body for ``POST /api/analyze``.

    Returns a flat, frontend-aligned structure rather than a nested engine dump.
    All fields are directly consumed by the React frontend without transformation.

    Attributes:
        venue: Human-readable venue name.
        timestamp: ISO 8601 UTC timestamp of the analysis.
        overall_grade: Letter grade A+ to F.
        crowd_score: Composite score 0-100.
        average_density: Mean density across all zones (pax/m²).
        zone_analyses: Per-zone density readings and classifications.
        evacuation_time_minutes: Estimated full evacuation time.
        evacuation_feasible: Whether evacuation meets the 8-min SGSA standard.
        accessibility_compliance: Whether venue meets ADA wheelchair requirements.
        wheelchair_ratio: Wheelchair seats / total capacity.
        sustainability_score: Sustainability sub-score 0-100.
        recycling_rate: Fraction of waste recycled (0.0-1.0).
        ai_insights: AI-generated narrative, or rule-based fallback text.
        ai_fallback: True if AI was unavailable and fallback text was used.
        route_recommendation: Recommended route for navigation/transportation.
    """

    venue: str
    timestamp: str
    overall_grade: str
    crowd_score: float
    average_density: float
    zone_analyses: list[ZoneAnalysis]
    evacuation_time_minutes: float
    evacuation_feasible: bool
    accessibility_compliance: bool
    wheelchair_ratio: float
    sustainability_score: float
    recycling_rate: float
    ai_insights: str
    ai_fallback: bool
    route_recommendation: RouteRecommendation


class FanAssistResponse(BaseModel):
    """Response body for ``POST /api/fan-assist``.

    Attributes:
        response: The assistant's reply text.
        language: Language code of the response.
        source: Attribution string (AI or fallback).
        fallback_used: True if AI was unavailable.
    """

    response: str
    language: str
    source: str
    fallback_used: bool = False


class HealthResponse(BaseModel):
    """Response body for ``GET /api/health``.

    Attributes:
        status: Overall application health status.
        supabase: Supabase connectivity status.
        version: Application version string.
    """

    status: str
    supabase: str
    version: str

class NavigationRequest(BaseModel):
    origin: str = Field(..., min_length=1, description="Zone ID, e.g. 'gate_a'")
    destination: str = Field(..., min_length=1)
    accessible_only: bool = Field(default=False)
    language: str = Field(default="en")

class NavigationStep(BaseModel):
    instruction: str
    zone: str
    minutes: float

class NavigationResponse(BaseModel):
    steps: list[NavigationStep]
    total_minutes: float
    accessible: bool
    narrative: str
    source: str  # "genai" | "fallback"

class TransportRequest(BaseModel):
    accessible_only: bool = Field(default=False)

class ParkingOption(BaseModel):
    id: str
    name: str
    capacity: int
    occupancy_pct: float
    walk_time_mins: int
    accessible_spaces: int
    status: str

class TransitOption(BaseModel):
    id: str
    name: str
    type: str
    frequency_mins: int
    crowd_level: str
    accessible: bool
    status: str

class TransportResponse(BaseModel):
    parking: list[ParkingOption]
    transit: list[TransitOption]

class EmergencyRequest(BaseModel):
    incident_type: str = Field(..., description="Type of emergency (medical, violence, etc)")
    severity: int = Field(..., ge=1, le=5, description="Severity 1-5")
    zone: str = Field(..., description="Location of incident")
    zone_density: float | None = Field(default=None, ge=0, description="Live density reading for the zone")

class EmergencyResponse(BaseModel):
    priority_level: str
    action_plan: list[str]
    requires_police: bool
    requires_medical: bool
    ai_brief: str
    escalated_due_to_crowd: bool = False
    crowd_level: str = "safe"
