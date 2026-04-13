"""Extraction API routes."""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from backend.services.extraction_adapters import extraction_to_legacy_passport
from backend.services.extraction_service import build_extraction_result
from backend.services.file_service import get_file_path
from backend.services.ocr_service import extract_text_from_document
from backend.services.mrz_service import parse_mrz_from_text

router = APIRouter(prefix="/extract-fields", tags=["Extraction"])


class ExtractRequest(BaseModel):
    file_id: str


@router.post("/")
async def extract_fields(request: ExtractRequest):
    """Extract OCR text, MRZ fields, and canonical extraction result."""
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    ocr_result = extract_text_from_document(file_path)
    raw_text = ocr_result.get("raw_text", "")

    mrz_fields = parse_mrz_from_text(raw_text)
    extraction = build_extraction_result(mrz_fields, raw_text)
    passport_data = extraction_to_legacy_passport(extraction)

    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "OCR + MRZ + passport data extraction completed",
        "file_id": request.file_id,
        "extraction": extraction.model_dump(mode="json"),
        "passport_data": passport_data,
        "mrz_fields": mrz_fields,
        "ocr_text": raw_text,
    }