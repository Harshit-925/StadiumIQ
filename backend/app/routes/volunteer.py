"""Volunteer allocation route — POST /api/volunteer/allocate."""

from fastapi import APIRouter, Request

from app.core.rate_limit import RATE_LIMIT_AI, limiter
from app.models.volunteer_schemas import (
    VolunteerRelocation,
    VolunteerRequest,
    VolunteerResponse,
)

router = APIRouter()


@router.post("/volunteer/allocate", response_model=VolunteerResponse)
@limiter.limit(RATE_LIMIT_AI)
async def allocate_volunteers(
    request: Request, body: VolunteerRequest
) -> VolunteerResponse:
    """Allocate available volunteers across zones and suggest any relocations.

    Uses deterministic heuristics — no I/O, always returns a result.
    """
    from app.engine.volunteer import (  # noqa: PLC0415
        Zone,
    )
    from app.engine.volunteer import (
        allocate_volunteers as _allocate,
    )
    from app.engine.volunteer import (
        suggest_relocation as _suggest,
    )

    zones_dicts: list[Zone] = [
        Zone(id=z.id, capacity=z.capacity, risk_level=z.risk_level)
        for z in body.zones
    ]

    allocations = _allocate(zones_dicts, body.available_staff)

    # Build updated_risk dict for relocation suggestions
    updated_risk = {z.id: z.risk_level for z in body.zones}
    raw_relocations = _suggest(allocations, updated_risk)

    relocations = [
        VolunteerRelocation(
            from_zone=r["from_zone"],
            to_zone=r["to_zone"],
            count=r["count"],
        )
        for r in raw_relocations
    ]

    return VolunteerResponse(
        allocations=allocations,
        relocations=relocations,
        total_allocated=sum(allocations.values()),
    )
