"""Pydantic v2 schemas for the Volunteer allocation endpoint."""

from __future__ import annotations

from pydantic import BaseModel, Field, field_validator


class VolunteerZone(BaseModel):
    """A single zone entry for volunteer allocation input."""

    id: str = Field(..., min_length=1, description="Zone identifier")
    capacity: int = Field(..., ge=1, le=100_000, description="Zone capacity")
    risk_level: str = Field(
        ...,
        pattern=r"^(CRITICAL|WARNING|MODERATE|SAFE)$",
        description="Risk level: CRITICAL | WARNING | MODERATE | SAFE",
    )


class VolunteerRequest(BaseModel):
    """Request body for ``POST /api/volunteer/allocate``."""

    zones: list[VolunteerZone] = Field(
        ...,
        min_length=1,
        description="List of zones to allocate volunteers across",
    )
    available_staff: int = Field(
        ..., ge=1, le=10_000, description="Total available volunteers"
    )

    @field_validator("zones")
    @classmethod
    def zone_ids_must_be_unique(cls, v: list[VolunteerZone]) -> list[VolunteerZone]:
        """Ensure no duplicate zone IDs."""
        ids = [z.id for z in v]
        if len(ids) != len(set(ids)):
            raise ValueError("Zone IDs must be unique.")
        return v


class VolunteerRelocation(BaseModel):
    """A single volunteer relocation suggestion."""

    from_zone: str
    to_zone: str
    count: int


class VolunteerResponse(BaseModel):
    """Response body for ``POST /api/volunteer/allocate``."""

    allocations: dict[str, int]
    relocations: list[VolunteerRelocation]
    total_allocated: int
