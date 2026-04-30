"""Document-related Pydantic schemas."""

from typing import Any, Optional

from pydantic import BaseModel, Field


class ExtractRequest(BaseModel):
    """Request schema for field extraction."""

    file_id: str


class TranslateRequest(BaseModel):
    """Request schema for field translation."""

    fields: dict[str, Any]
    target_language: str


class TemplateLanguageInfo(BaseModel):
    code: str
    name: str


class TemplateInfo(BaseModel):
    """Public-facing template metadata."""

    id: str
    country_code: Optional[str] = None
    country_aliases: list[str] = Field(default_factory=list)
    name: dict[str, str] = Field(default_factory=dict)
    description: str = ""
    languages: list[TemplateLanguageInfo] = Field(default_factory=list)
    version: str = "0.0.0"


class GenerateDocumentRequest(BaseModel):
    """Render a template using a previously processed extraction."""

    template_id: str
    extraction: dict[str, Any] = Field(
        description="ExtractionResult.model_dump() returned by /process-document/",
    )
    primary_language: Optional[str] = Field(
        default=None,
        description="Language used for the user-edited translations (e.g. 'Russian')",
    )
    primary_overrides: Optional[dict[str, Any]] = Field(
        default=None,
        description=(
            "User-edited translated_passport_data for the primary_language. "
            "When the template requires this language, these values are used "
            "verbatim instead of re-running the translator."
        ),
    )


class GenerateDocumentResponse(BaseModel):
    document_id: str
    template_id: str
    download_url: str
    filename: str
