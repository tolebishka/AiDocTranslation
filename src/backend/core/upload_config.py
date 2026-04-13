"""Upload validation configuration."""

import os

# Allowed file extensions (lowercase, with leading dot)
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png"}

# Allowed MIME types (must match allowed extensions)
ALLOWED_MIME_TYPES = {"image/jpeg", "image/png"}

# Max file size in bytes (default 10 MB)
MAX_FILE_SIZE_BYTES = int(
    os.environ.get("UPLOAD_MAX_FILE_SIZE_MB", "10")
) * 1024 * 1024

# Magic bytes for JPEG and PNG (used to verify actual file type)
JPEG_SIGNATURE = bytes([0xFF, 0xD8, 0xFF])
PNG_SIGNATURE = bytes([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A])

EXTENSION_TO_SIGNATURE: dict[str, tuple[bytes, ...]] = {
    ".jpg": (JPEG_SIGNATURE,),
    ".jpeg": (JPEG_SIGNATURE,),
    ".png": (PNG_SIGNATURE,),
}
