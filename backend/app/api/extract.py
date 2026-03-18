"""Extraction API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from services.file_service import get_file_path

router = APIRouter(prefix="/extract-fields", tags=["Extraction"])


class ExtractRequest(BaseModel):
    file_id: str


@router.post("/")
async def extract_fields(request: ExtractRequest):
    """Extract fields from uploaded document."""
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "File found and ready for extraction",
        "file_id": request.file_id,
        "file_path": file_path,
    }