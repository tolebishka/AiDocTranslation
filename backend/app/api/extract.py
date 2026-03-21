"""Extraction API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.file_service import get_file_path
from services.ocr_service import extract_text_from_document
from services.mrz_service import parse_mrz_from_text

router = APIRouter(prefix="/extract-fields", tags=["Extraction"])


class ExtractRequest(BaseModel):
    file_id: str


@router.post("/")
async def extract_fields(request: ExtractRequest):
    """Extract OCR text and MRZ fields from uploaded document."""
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    ocr_result = extract_text_from_document(file_path)
    raw_text = ocr_result.get("raw_text", "")

    mrz_fields = parse_mrz_from_text(raw_text)

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "OCR extraction completed",
        "file_id": request.file_id,
        "ocr_text": raw_text,
        "mrz_fields": mrz_fields,
    }