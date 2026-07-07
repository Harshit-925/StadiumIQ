"""Structured JSON logging with request-ID correlation.

Provides:
- JSONFormatter: stdlib logging formatter that outputs structured JSON lines.
- RequestIdMiddleware: ASGI middleware that generates a UUID per request,
  binds it to every log line via a ContextVar, and echoes it as X-Request-Id.
- setup_logging: one-call bootstrap that wires everything up.
"""

import json
import logging
import time
import uuid
from contextvars import ContextVar
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from starlette.requests import Request
from starlette.responses import Response

# ContextVar holding the current request ID — accessible from any async frame.
request_id_ctx: ContextVar[str] = ContextVar("request_id", default="-")

logger = logging.getLogger("stadiumiq")


class JSONFormatter(logging.Formatter):
    """Logging formatter that emits one JSON object per log line.

    Fields: timestamp, level, message, request_id, logger, plus any extras
    passed via the ``extra`` kwarg on log calls.
    """

    def format(self, record: logging.LogRecord) -> str:
        """Format a LogRecord as a JSON string.

        Args:
            record: The log record to format.

        Returns:
            A JSON-encoded string representing the log entry.
        """
        log_entry: dict[str, Any] = {
            "timestamp": self.formatTime(record, self.datefmt),
            "level": record.levelname,
            "message": record.getMessage(),
            "request_id": request_id_ctx.get("-"),
            "logger": record.name,
        }

        # Merge any structured extras the caller attached.
        extra_data = getattr(record, "extra_data", None)
        if isinstance(extra_data, dict):
            log_entry.update(extra_data)

        if record.exc_info:
            log_entry["exception"] = self.formatException(record.exc_info)

        return json.dumps(log_entry, default=str)


class RequestIdMiddleware(BaseHTTPMiddleware):
    """ASGI middleware that assigns a UUID to every request.

    The ID is:
    - stored in ``request_id_ctx`` so downstream code and log lines pick it up,
    - echoed back to the client as the ``X-Request-Id`` response header,
    - used to log method, path, status code, and duration of every request.
    """

    async def dispatch(
        self, request: Request, call_next: RequestResponseEndpoint
    ) -> Response:
        """Process a request, assigning a unique request ID.

        Args:
            request: The incoming HTTP request.
            call_next: Callable to invoke the next middleware/handler.

        Returns:
            The HTTP response with X-Request-Id header attached.
        """
        rid = uuid.uuid4().hex
        token = request_id_ctx.set(rid)
        start = time.perf_counter()
        response: Response | None = None

        try:
            response = await call_next(request)
        except Exception:
            logger.exception(
                "Unhandled exception during request processing",
                extra={
                    "extra_data": {"method": request.method, "path": request.url.path}
                },
            )
            raise
        finally:
            duration_ms = round((time.perf_counter() - start) * 1000, 2)
            log_data: dict[str, Any] = {
                "method": request.method,
                "path": request.url.path,
                "status": response.status_code if response else 500,
                "duration_ms": duration_ms,
            }
            status_code = log_data["status"]
            if status_code == 429:
                logger.warning(
                    "Rate-limited request",
                    extra={"extra_data": log_data},
                )
            elif status_code >= 400:
                logger.warning(
                    "Request completed with error",
                    extra={"extra_data": log_data},
                )
            else:
                logger.info(
                    "Request completed",
                    extra={"extra_data": log_data},
                )
            request_id_ctx.reset(token)

        response.headers["X-Request-Id"] = rid
        return response


def setup_logging(level: int = logging.INFO) -> None:
    """Bootstrap structured JSON logging for the application.

    Wires up the ``stadiumiq`` logger with a JSONFormatter on stderr and sets
    the log level.  Safe to call multiple times (idempotent).

    Args:
        level: The logging level to use (default INFO).
    """
    root = logging.getLogger("stadiumiq")
    if root.handlers:
        return  # already configured

    handler = logging.StreamHandler()
    handler.setFormatter(JSONFormatter())
    root.addHandler(handler)
    root.setLevel(level)

    # Quieten noisy libraries
    logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
    logging.getLogger("httpx").setLevel(logging.WARNING)
