"""Upload API routes."""

import logging
import time

from fastapi import APIRouter, File, UploadFile

from core.logging_config import safe_log
from services.file_service import cleanup_old_files, save_file

router = APIRouter(prefix="/upload", tags=["Upload"])
logger = logging.getLogger(__name__)


@router.post("/")
async def upload_document(file: UploadFile = File(...)):
    """Upload document endpoint. Validates extension, MIME, size, and content."""
    t0 = time.perf_counter()
    cleanup_old_files()

    saved_file = await save_file(file)

    duration_ms = (time.perf_counter() - t0) * 1000
    safe_log(
        logger,
        logging.INFO,
        "Upload success",
        endpoint="/upload/",
        duration_ms=duration_ms,
        status="ok",
        size_bytes=saved_file["size_bytes"],
        content_type=saved_file["content_type"],
    )

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "Document uploaded successfully",
        "file_id": saved_file["file_id"],
        "filename": saved_file["filename"],
        "stored_as": saved_file["stored_as"],
        "file_path": saved_file["file_path"],
        "content_type": saved_file["content_type"],
        "size_bytes": saved_file["size_bytes"],
    }