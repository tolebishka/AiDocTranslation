"""Translation API routes."""

from typing import Any, Dict

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from services.translate_service import translate_passport_data

router = APIRouter(prefix="/translate-fields", tags=["Translation"])


class TranslateRequest(BaseModel):
    passport_data: Dict[str, Any]
    target_language: str


@router.post("/")
async def translate_fields(request: TranslateRequest):
    """Translate structured passport data."""
    try:
        translated_passport_data = translate_passport_data(
            passport_data=request.passport_data,
            target_language=request.target_language,
        )

        return {
            "status": "ok",
            "service": "AiDocTranslation",
            "message": "Passport data translated successfully",
            "target_language": request.target_language,
            "translated_passport_data": translated_passport_data,
        }

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))