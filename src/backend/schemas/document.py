"""Document-related Pydantic schemas."""

from typing import Any

from pydantic import BaseModel


class ExtractRequest(BaseModel):
    """Request schema for field extraction."""

    file_id: str


class TranslateRequest(BaseModel):
    """Request schema for field translation."""

    fields: dict[str, Any]
    target_language: str


class GenerateRequest(BaseModel):
    """Request schema for document generation."""

    translated_fields: dict[str, Any]
    template_id: str
