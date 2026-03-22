"""Upload API routes."""

from fastapi import APIRouter, File, UploadFile

from services.file_service import cleanup_old_files, save_file

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/")
async def upload_document(file: UploadFile = File(...)):
    """Upload document endpoint. Validates extension, MIME, size, and content."""
    cleanup_old_files()
    saved_file = await save_file(file)
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