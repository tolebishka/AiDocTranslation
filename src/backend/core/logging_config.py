"""Production-safe logging. Never logs PII, document content, MRZ, or filenames."""

import logging
import uuid
from contextvars import ContextVar

request_id_ctx: ContextVar[str] = ContextVar("request_id", default="")


def set_request_id(request_id: str | None = None) -> str:
    """Set or generate request ID. Returns the ID."""
    if request_id and len(request_id) <= 64 and "\n" not in request_id:
        rid = request_id[:36].strip()
    else:
        rid = str(uuid.uuid4())[:12]
    request_id_ctx.set(rid)
    return rid


def get_request_id() -> str:
    """Get current request ID or empty string."""
    return request_id_ctx.get("")


def safe_log(
    logger: logging.Logger,
    level: int,
    msg: str,
    *,
    endpoint: str = "",
    duration_ms: float | None = None,
    error_code: str | None = None,
    status: str = "",
    size_bytes: int | None = None,
    content_type: str | None = None,
) -> None:
    """Log safe metadata only. Never pass document content, names, MRZ, file paths."""
    parts = [msg]
    rid = get_request_id()
    if rid:
        parts.append(f"request_id={rid}")
    if endpoint:
        parts.append(f"endpoint={endpoint}")
    if duration_ms is not None:
        parts.append(f"duration_ms={round(duration_ms, 1)}")
    if error_code:
        parts.append(f"error_code={error_code}")
    if status:
        parts.append(f"status={status}")
    if size_bytes is not None:
        parts.append(f"size_bytes={size_bytes}")
    if content_type:
        parts.append(f"content_type={content_type}")
    logger.log(level, " ".join(parts))
