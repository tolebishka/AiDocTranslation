"""Full document processing API routes."""

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.file_service import get_file_path
from services.ocr_service import extract_text_from_document
from services.mrz_service import parse_mrz_from_text
from services.passport_service import build_passport_data
from services.translate_service import translate_passport_data

router = APIRouter(prefix="/process-document", tags=["Processing"])


class ProcessDocumentRequest(BaseModel):
    file_id: str
    target_language: str


@router.post("/")
async def process_document(request: ProcessDocumentRequest):
    """Run full pipeline: OCR -> MRZ -> passport_data -> translation."""
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="File not found")

    try:
        ocr_result = extract_text_from_document(file_path)
        raw_text = ocr_result.get("raw_text", "")

        mrz_fields = parse_mrz_from_text(raw_text)
        passport_data = build_passport_data(mrz_fields, raw_text)

        translated_passport_data = translate_passport_data(
            passport_data=passport_data,
            target_language=request.target_language,
        )

        return {
            "status": "ok",
            "service": "AiDocTranslation",
            "message": "Document processed successfully",
            "file_id": request.file_id,
            "passport_data": passport_data,
            "translated_passport_data": translated_passport_data,
            "mrz_fields": mrz_fields,
            "ocr_text": raw_text,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))