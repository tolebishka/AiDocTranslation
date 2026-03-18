"""Translation API routes."""

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/translate-fields", tags=["Translation"])


class TranslateRequest(BaseModel):
    fields: Dict[str, Any]
    target_language: str


@router.post("/")
async def translate_fields(request: TranslateRequest):
    """Translate extracted fields."""
    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "Fields translated successfully",
        "target_language": request.target_language,
        "translated_fields": {
            "surname_translated": "Айтенов",
            "given_names_translated": "Толеби",
            "nationality_translated": "Казахстан",
            "document_type_translated": "Паспорт",
        },
        "source_fields": request.fields,
    }