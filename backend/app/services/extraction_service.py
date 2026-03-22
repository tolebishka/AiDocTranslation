"""Extraction service producing canonical schema from MRZ + OCR."""

from schemas.canonical import (
    ExtractionFields,
    ExtractionResult,
    MrzBlock,
)
from services.name_normalizer import split_name_and_patronymic
from services.passport_service import (
    extract_date_of_issue,
    extract_issuing_authority,
    extract_place_of_birth,
    extract_place_of_issue,
    normalize_ocr_text,
)


def build_extraction_result(mrz_fields: dict | None, ocr_text: str) -> ExtractionResult:
    """
    Build canonical ExtractionResult from MRZ parse and OCR text.
    MRZ is source of truth for core fields; OCR supplies supplemental fields.
    Personal names are normalized to split patronymic when detected.
    """
    normalized = normalize_ocr_text(ocr_text or "")
    lines = [line.strip() for line in normalized.splitlines() if line.strip()]

    fields = ExtractionFields()

    if mrz_fields:
        fields.surname = _str(mrz_fields.get("surname_latin"))
        raw_given = _str(mrz_fields.get("given_names_latin"))
        name, fathers_name = split_name_and_patronymic(raw_given)
        fields.name = name
        fields.fathers_name = fathers_name
        fields.document_number = _str(mrz_fields.get("passport_number"))
        fields.nationality = _str(mrz_fields.get("nationality"))
        fields.date_of_birth = _str(mrz_fields.get("date_of_birth"))
        fields.sex = _str(mrz_fields.get("sex"))
        fields.date_of_expiry = _str(mrz_fields.get("date_of_expiry"))

    fields.place_of_birth = extract_place_of_birth(lines)
    fields.place_of_issue = extract_place_of_issue(lines)
    fields.date_of_issue = extract_date_of_issue(lines)
    fields.issuing_authority = extract_issuing_authority(lines)

    mrz = MrzBlock(
        line1=_str(mrz_fields.get("mrz_line_1")) if mrz_fields else None,
        line2=_str(mrz_fields.get("mrz_line_2")) if mrz_fields else None,
    )

    return ExtractionResult(
        country=_str(mrz_fields.get("issuing_country")) if mrz_fields else None,
        document_type=_str(mrz_fields.get("document_type")) if mrz_fields else None,
        side="front",
        fields=fields,
        mrz=mrz,
        raw_text=ocr_text or None,
        warnings=[],
        confidence={},
    )


def _str(v: str | None) -> str | None:
    if v is None:
        return None
    s = str(v).strip()
    return s if s else None
