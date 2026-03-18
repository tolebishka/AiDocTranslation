"""Upload API routes."""

from fastapi import APIRouter, File, UploadFile
from services.file_service import save_file

router = APIRouter(prefix="/upload", tags=["Upload"])


@router.post("/")
async def upload_document(file: UploadFile = File(...)):
    """Upload document endpoint."""
    saved_file = await save_file(file)

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "Document uploaded successfully",
        **saved_file,
    }