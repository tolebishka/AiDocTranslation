"""
Canonical extraction result schema.

Unified structure for all document types and countries.
Scalable for: more countries, back side, PDF, DOCX export.
"""

from typing import Any

from pydantic import BaseModel, Field


# Centralized field names; use these across extraction, translation, export
EXTRACTION_FIELD_KEYS = (
    "surname",
    "name",
    "fathers_name",
    "document_number",
    "nationality",
    "date_of_birth",
    "sex",
    "place_of_birth",
    "place_of_issue",
    "date_of_issue",
    "date_of_expiry",
    "issuing_authority",
)


class ExtractionFields(BaseModel):
    """Document fields. All nullable; absent for documents that lack them."""

    surname: str | None = None
    name: str | None = None
    fathers_name: str | None = None
    document_number: str | None = None
    nationality: str | None = None
    date_of_birth: str | None = None
    sex: str | None = None
    place_of_birth: str | None = None
    place_of_issue: str | None = None
    date_of_issue: str | None = None
    date_of_expiry: str | None = None
    issuing_authority: str | None = None


class MrzBlock(BaseModel):
    """MRZ raw lines."""

    line1: str | None = None
    line2: str | None = None


class ExtractionResult(BaseModel):
    """Canonical extraction result for any document type/country."""

    country: str | None = None
    document_type: str | None = None
    side: str = "front"
    fields: ExtractionFields = Field(default_factory=ExtractionFields)
    mrz: MrzBlock = Field(default_factory=MrzBlock)
    raw_text: str | None = None
    warnings: list[str] = Field(default_factory=list)
    confidence: dict[str, Any] = Field(default_factory=dict)
