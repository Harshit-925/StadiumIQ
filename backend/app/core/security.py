"""Security headers middleware.

Adds defence-in-depth HTTP response headers on every response to mitigate
clickjacking, MIME-sniffing, and other common web vulnerabilities.
"""

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

from app.core.config import get_settings

# ── Header values as constants so tests can assert against them ──────────
HSTS_VALUE = "max-age=31536000"
def get_csp_value() -> str:
    settings = get_settings()
    pb_url = settings.pocketbase_url
    pb_ws = pb_url.replace("http://", "ws://").replace("https://", "wss://")
    return (
        "default-src 'self'; "
        "script-src 'self'; "
        "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
        f"connect-src 'self' https://generativelanguage.googleapis.com {pb_url} {pb_ws} http://localhost:8090 http://127.0.0.1:8090 ws://localhost:8090 ws://127.0.0.1:8090; "
        "img-src 'self' data:; "
        "font-src 'self' https://fonts.gstatic.com"
    )
PERMISSIONS_POLICY_VALUE = "camera=(), microphone=(), geolocation=()"


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that injects security headers into every HTTP response.

    Headers set:
    - X-Content-Type-Options: nosniff
    - X-Frame-Options: DENY
    - Permissions-Policy: camera=(), microphone=(), geolocation=()
    - Strict-Transport-Security: max-age=31536000
    - Content-Security-Policy: restrictive default policy
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Add security headers to the response.

        Args:
            request: The incoming HTTP request.
            call_next: Callable to invoke the next middleware/handler.

        Returns:
            The HTTP response with security headers attached.
        """
        response = await call_next(request)

        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["Permissions-Policy"] = PERMISSIONS_POLICY_VALUE
        response.headers["Strict-Transport-Security"] = HSTS_VALUE
        response.headers["Content-Security-Policy"] = get_csp_value()

        return response
