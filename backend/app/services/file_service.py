"""File service for saving and retrieving uploaded documents."""

import os
import uuid
from fastapi import UploadFile

UPLOAD_DIR = "storage/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)


async def save_file(file: UploadFile) -> dict:
    """Save uploaded file locally and return metadata."""
    file_id = str(uuid.uuid4())

    original_name = file.filename or "uploaded_file"
    extension = original_name.split(".")[-1] if "." in original_name else "bin"

    stored_name = f"{file_id}.{extension}"
    file_path = os.path.join(UPLOAD_DIR, stored_name)

    content = await file.read()
    with open(file_path, "wb") as buffer:
        buffer.write(content)

    return {
        "file_id": file_id,
        "filename": original_name,
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