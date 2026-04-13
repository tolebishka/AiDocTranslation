"""Upload validation helpers."""

import re
import unicodedata

from backend.core.upload_config import (
    ALLOWED_EXTENSIONS,
    ALLOWED_MIME_TYPES,
    EXTENSION_TO_SIGNATURE,
    MAX_FILE_SIZE_BYTES,
)


class UploadValidationError(Exception):
    """Raised when file upload validation fails."""

    def __init__(self, message: str, error_code: str = "validation_error"):
        self.message = message
        self.error_code = error_code
        super().__init__(message)


def validate_extension(filename: str | None) -> str:
    """Return normalized extension if valid, else raise UploadValidationError."""
    msg = "Unsupported file type. Use JPG or PNG"
    if not filename or not filename.strip():
        raise UploadValidationError(msg, "unsupported_format")
    ext = "." + filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext not in ALLOWED_EXTENSIONS:
        raise UploadValidationError(msg, "unsupported_format")
    return ext


def validate_mime(content_type: str | None) -> None:
    """Validate MIME type or raise UploadValidationError."""
    msg = "Unsupported file type. Use JPG or PNG"
    if not content_type:
        raise UploadValidationError(msg, "unsupported_format")
    mime = content_type.split(";")[0].strip().lower()
    if mime not in ALLOWED_MIME_TYPES:
        raise UploadValidationError(msg, "unsupported_format")


def validate_size(size_bytes: int) -> None:
    """Validate file size or raise UploadValidationError."""
    if size_bytes == 0:
        raise UploadValidationError("Uploaded file is empty", "file_empty")
    if size_bytes > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise UploadValidationError(
            f"File is too large. Maximum size is {max_mb} MB",
            "file_too_large",
        )


def validate_magic_bytes(content: bytes, extension: str) -> None:
    """Verify file content matches expected signature for extension."""
    signatures = EXTENSION_TO_SIGNATURE.get(extension)
    if not signatures:
        return
    for sig in signatures:
        if content.startswith(sig):
            return
    raise UploadValidationError(
        "Unsupported file type. Use JPG or PNG",
        "unsupported_format",
    )


def sanitize_filename(original: str | None) -> str:
    """Produce a safe display filename; never used for storage."""
    if not original or not original.strip():
        return "document"
    name = original.strip()
    name = unicodedata.normalize("NFKC", name)
    name = re.sub(r"[^\w\s\-_.]", "", name)
    name = re.sub(r"\s+", "_", name)
    name = name[:64].strip("._-") or "document"
    return name
