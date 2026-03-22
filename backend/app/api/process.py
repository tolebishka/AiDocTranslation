"""Full document processing API routes."""

import logging
import time

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from core.errors import AppError
from core.logging_config import safe_log
from services.extraction_adapters import extraction_to_legacy_passport
from services.extraction_service import build_extraction_result
from services.file_service import cleanup_old_files, delete_file, get_file_path
from services.ocr_service import extract_text_from_document
from services.mrz_service import parse_mrz_from_text
from services.translate_service import translate_passport_data

router = APIRouter(prefix="/process-document", tags=["Processing"])
logger = logging.getLogger(__name__)


class ProcessDocumentRequest(BaseModel):
    file_id: str
    target_language: str


@router.post("/")
async def process_document(request: ProcessDocumentRequest):
    """Run full pipeline: OCR -> MRZ -> canonical extraction -> translation."""
    t0 = time.perf_counter()
    file_path = get_file_path(request.file_id)

    if not file_path:
        raise HTTPException(status_code=404, detail="Document not found")

    try:
        cleanup_old_files()

        ocr_result = extract_text_from_document(file_path)
        raw_text = ocr_result.get("raw_text", "")

        mrz_fields = parse_mrz_from_text(raw_text)
        if not mrz_fields:
            raise AppError(
                "no_mrz_detected",
                "We couldn't detect the document zone. Please take a clearer photo",
                422,
            )

        extraction = build_extraction_result(mrz_fields, raw_text)
        passport_data = extraction_to_legacy_passport(extraction)

        translated_passport_data = translate_passport_data(
            passport_data=passport_data,
            target_language=request.target_language,
        )

        duration_ms = (time.perf_counter() - t0) * 1000
        safe_log(
            logger,
            logging.INFO,
            "Process success",
            endpoint="/process-document/",
            duration_ms=duration_ms,
            status="ok",
        )

        return {
            "status": "ok",
            "service": "AiDocTranslation",
            "message": "Document processed successfully",
            "file_id": request.file_id,
            "extraction": extraction.model_dump(mode="json"),
            "passport_data": passport_data,
            "translated_passport_data": translated_passport_data,
            "mrz_fields": mrz_fields,
            "ocr_text": raw_text,
        }

    finally:
        delete_file(file_path)