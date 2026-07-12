"""StadiumIQ Domain Engine — cited sources and constants."""

CROWD_DENSITY_SOURCE: str = (
    "Prof. G. Keith Still, Crowd Science — crowd density thresholds (gkstill.com)"
)
EVACUATION_SOURCE: str = (
    "SGSA Guide to Safety at Sports Grounds (Green Guide), 6th Edition "
    "— 8-minute evacuation standard"
)
FLOW_RATE_SOURCE: str = (
    "SGSA Green Guide — 82 persons per metre width per minute on level surfaces"
)
ACCESSIBILITY_SOURCE: str = (
    "ADA Standards for Accessible Design — minimum 1% wheelchair seating of total capacity"
)
SUSTAINABILITY_SOURCE: str = (
    "EPA Sustainable Materials Management / FIFA Sustainability Strategy 2024-2030"
)

FLOW_RATE_PER_METER_PER_MIN: int = 82  # persons per metre width per minute
MAX_EVACUATION_MINUTES: int = 8  # FIFA/SGSA maximum
WHEELCHAIR_RATIO: float = 0.01  # 1 % minimum ADA
WASTE_DIVERSION_TARGET: float = 90.0  # percent — EPA target
DENSITY_SAFE_MAX: float = 2.0        # < this = "safe"
DENSITY_MODERATE_MAX: float = 3.5    # < this = "moderate"
DENSITY_WARNING_MAX: float = 4.5     # <= this = "warning"; above = "critical"
