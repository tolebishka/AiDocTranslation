"""File service for saving and retrieving uploaded documents."""

import os
import time
import uuid

from fastapi import UploadFile

from backend.core.config import UPLOAD_DIR, UPLOAD_TTL_SECONDS
from backend.core.upload_config import MAX_FILE_SIZE_BYTES
from backend.services.upload_validator import (
    UploadValidationError,
    sanitize_filename,
    validate_extension,
    validate_magic_bytes,
    validate_mime,
    validate_size,
)

os.makedirs(UPLOAD_DIR, exist_ok=True)
CHUNK_SIZE = 8192


async def _read_with_size_limit(file: UploadFile) -> bytes:
    """Read file in chunks, raise if exceeds MAX_FILE_SIZE_BYTES."""
    chunks: list[bytes] = []
    total = 0
    while True:
        chunk = await file.read(CHUNK_SIZE)
        if not chunk:
            break
        total += len(chunk)
        if total > MAX_FILE_SIZE_BYTES:
            max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
            raise UploadValidationError(
                f"File is too large. Maximum size is {max_mb} MB",
                "file_too_large",
            )
        chunks.append(chunk)
    return b"".join(chunks)


async def save_file(file: UploadFile) -> dict:
    """Validate and save uploaded file. Raises UploadValidationError if invalid."""
    extension = validate_extension(file.filename)
    validate_mime(file.content_type)

    content = await _read_with_size_limit(file)
    validate_size(len(content))
    validate_magic_bytes(content, extension)

    file_id = str(uuid.uuid4())
    stored_name = f"{file_id}{extension}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    with open(file_path, "wb") as buffer:
        buffer.write(content)

    display_name = sanitize_filename(file.filename)
    if not display_name.endswith(extension):
        display_name = f"{display_name}{extension}"

    return {
        "file_id": file_id,
        "filename": display_name,
        "stored_as": stored_name,
        "file_path": file_path,
        "content_type": file.content_type,
        "size_bytes": len(content),
    }


def get_file_path(file_id: str) -> str | None:
    """Find uploaded file path by file_id."""
    if not os.path.exists(UPLOAD_DIR):
        return None

    for filename in os.listdir(UPLOAD_DIR):
        if filename.startswith(file_id):
            return os.path.join(UPLOAD_DIR, filename)

    return None

def cleanup_old_files():
    """Delete files older than TTL."""
    if not os.path.exists(UPLOAD_DIR):
        return

    now = time.time()

    for filename in os.listdir(UPLOAD_DIR):
        file_path = os.path.join(UPLOAD_DIR, filename)

        if not os.path.isfile(file_path):
            continue

        try:
            modified_time = os.path.getmtime(file_path)
            if now - modified_time > UPLOAD_TTL_SECONDS:
                os.remove(file_path)
        except Exception:
            continue

def delete_file(file_path: str):
    """Delete a file if it exists."""
    try:
        if file_path and os.path.exists(file_path):
            os.remove(file_path)
    except Exception:
        pass