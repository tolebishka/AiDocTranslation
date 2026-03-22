"""User-facing error types and response formatting."""

import logging

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
    """Map internal exceptions to user-friendly (error_code, message, status_code)."""
    err_msg = str(exc).lower()
    logger.exception("Request failed", exc_info=exc)

    if "vision api" in err_msg or "invalid_argument" in err_msg or "image" in err_msg:
        return "image_quality", "Image is too blurry. Please retake the photo", 422
    if "blur" in err_msg or "quality" in err_msg:
        return "image_quality", "Image is too blurry. Please retake the photo", 422

    return "processing_error", "Something went wrong. Please try again", 500
