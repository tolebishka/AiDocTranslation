"""Extraction API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.file_service import get_file_path
from services.ocr_service import extract_text_from_document
from services.mrz_service import parse_mrz_from_text
from services.passport_service import build_passport_data

router = APIRouter(prefix="/extract-fields", tags=["Extraction"])


class ExtractRequest(BaseModel):
    file_id: str


@router.post("/")
async def extract_fields(request: ExtractRequest):
    """Extract OCR text, MRZ fields, and unified passport data."""
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    ocr_result = extract_text_from_document(file_path)
    raw_text = ocr_result.get("raw_text", "")

    mrz_fields = parse_mrz_from_text(raw_text)
    passport_data = build_passport_data(mrz_fields, raw_text)

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "OCR + MRZ + passport data extraction completed",
        "file_id": request.file_id,
        "passport_data": passport_data,
        "mrz_fields": mrz_fields,
        "ocr_text": raw_text,
    }