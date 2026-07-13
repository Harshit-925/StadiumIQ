# StadiumIQ Routes Package
"""Aggregates all domain routers into a single master API router."""

from fastapi import APIRouter

from app.routes.analyze import router as analyze_router
from app.routes.emergency import router as emergency_router
from app.routes.fan_assist import router as fan_assist_router
from app.routes.health import router as health_router
from app.routes.navigation import router as navigation_router
from app.routes.transport import router as transport_router

router = APIRouter(prefix="/api", tags=["StadiumIQ"])

router.include_router(health_router)
router.include_router(analyze_router)
router.include_router(navigation_router)
router.include_router(transport_router)
router.include_router(emergency_router)
router.include_router(fan_assist_router)
