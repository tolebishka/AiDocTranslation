"""Document generation API routes."""

from typing import Any, Dict

from fastapi import APIRouter
from pydantic import BaseModel


router = APIRouter(prefix="/generate-document", tags=["Generation"])


class GenerateRequest(BaseModel):
    translated_fields: Dict[str, Any]
    template_id: str


@router.post("/")
async def generate_document(request: GenerateRequest):
    """Generate translated document."""
    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "Document generated successfully",
        "template_id": request.template_id,
        "document_id": "mock_document_id_001",
        "download_url": "/generate-document/download/mock_document_id_001",
        "translated_fields": request.translated_fields,
    }


@router.get("/download/{document_id}")
async def download_document(document_id: str):
    """Download generated document."""
    return {
        "status": "ok",
        "service": "AiDocTranslation",
        "message": "Document downloaded successfully",
        "document_id": document_id,
    }