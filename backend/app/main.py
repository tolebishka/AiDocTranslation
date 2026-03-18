"""AiDocTranslation FastAPI backend."""

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, UploadFile, File
from pydantic import BaseModel
from typing import Dict, Any

app = FastAPI(
    title="AiDocTranslation",
    description="Document translation and generation API",
    version="0.1.0",
)

# Schemas

class ExtractRequest(BaseModel):
    file_id: str


class TranslateRequest(BaseModel):
    fields: Dict[str, Any]
    target_language: str


class GenerateRequest(BaseModel):
    translated_fields: Dict[str, Any]
    template_id: str

# Endpoints

@app.get("/")
async def root():
    """Root endpoint."""
    return {"status": "ok", "service": "AiDocTranslation", "message": "Service is running"}

@app.post("/upload", tags=["upload"])
async def upload_document(file: UploadFile = File(...)):
    """Upload document endpoint."""
    
    # TODO: сохранить файл и вернуть file_id
    return {
        "status": "ok",
        "file_id": "mock_file_id",
        "filename": file.filename
    }


@app.post("/extract-fields", tags=["extract-fields"])
async def extract_fields(request: ExtractRequest):
    """Extract fields from document."""
    
    # TODO: вызвать OCR (Azure)
    return {
        "status": "ok",
        "file_id": request.file_id,
        "fields": {
            "surname_latin": "AITENOV",
            "given_names_latin": "TOLEBI",
            "passport_number": "N1234567"
        }
    }


@app.post("/translate-fields", tags=["translate-fields"])
async def translate_fields(request: TranslateRequest):
    """Translate extracted fields."""
    
    # TODO: вызвать GPT
    return {
        "status": "ok",
        "translated_fields": {
            "surname_translated": "Айтенов",
            "given_names_translated": "Толеби"
        }
    }


@app.post("/generate-document", tags=["generate-document"])
async def generate_document(request: GenerateRequest):
    """Generate DOCX document."""
    
    # TODO: docxtpl
    return {
        "status": "ok",
        "document_id": "mock_doc_id",
        "download_url": "/download/mock_doc_id"
    }


@app.get("/download/{document_id}", tags=["download-document"])
async def download_document(document_id: str):
    """Download generated document."""
    
    # TODO: вернуть файл
    return {
        "status": "ok",
        "document_id": document_id,
        "message": "Document ready for download"
    }