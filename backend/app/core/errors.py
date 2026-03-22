"""User-facing error types and response formatting."""

import logging

from core.logging_config import get_request_id, safe_log

logger = logging.getLogger(__name__)


def error_response(error: str, message: str) -> dict:
    """Standard error body. Include 'detail' for FastAPI/client compatibility."""
    return {
        "error": error,
        "message": message,
        "detail": message,
    }


class AppError(Exception):
    """Base for user-facing errors. Never exposes internals."""

    def __init__(self, error_code: str, message: str, status_code: int = 400):
        self.error_code = error_code
        self.message = message
        self.status_code = status_code
        super().__init__(message)


def classify_and_log(exc: Exception) -> tuple[str, str, int]:
    """
    Map internal exceptions to user-friendly (error_code, message, status_code).
    Logs only error category and exception type — never raw exception message
    (may contain sensitive data from internal layers).
    """
    err_msg = str(exc).lower()

    if "vision api" in err_msg or "invalid_argument" in err_msg or "image" in err_msg:
        error_code = "image_quality"
        status_code = 422
    elif "blur" in err_msg or "quality" in err_msg:
        error_code = "image_quality"
        status_code = 422
    else:
        error_code = "processing_error"
        status_code = 500

    safe_log(
        logger,
        logging.ERROR,
        "Request failed",
        error_code=error_code,
        status="error",
    )
    logger.debug("Exception type: %s", type(exc).__name__, exc_info=exc)

    msg = "Image is too blurry. Please retake the photo" if error_code == "image_quality" else "Something went wrong. Please try again"
    return error_code, msg, status_code
