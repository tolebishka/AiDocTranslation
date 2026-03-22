"""Adapters between canonical extraction and legacy API shapes."""

from typing import Any

from schemas.canonical import ExtractionResult


def extraction_to_legacy_passport(extraction: ExtractionResult) -> dict[str, Any]:
    """Convert canonical extraction to legacy passport_data for frontend."""
    f = extraction.fields
    return {
        "document_type": extraction.document_type,
        "issuing_country": extraction.country,
        "surname_latin": f.surname,
        "given_names_latin": f.name,
        "fathers_name": f.fathers_name,
        "passport_number": f.document_number,
        "nationality": f.nationality,
        "date_of_birth": f.date_of_birth,
        "sex": f.sex,
        "place_of_birth": f.place_of_birth,
        "place_of_issue": f.place_of_issue,
        "date_of_issue": f.date_of_issue,
        "date_of_expiry": f.date_of_expiry,
        "issuing_authority": f.issuing_authority,
    }


def extraction_to_legacy_mrz(extraction: ExtractionResult) -> dict[str, Any] | None:
    """Convert canonical to legacy mrz_fields when raw parser output is unavailable."""
    if not extraction.mrz.line1 and not extraction.mrz.line2:
        return None
    return {
        "mrz_type": "TD3",
        "document_type": extraction.document_type,
        "issuing_country": extraction.country,
        "surname_latin": extraction.fields.surname,
        "given_names_latin": extraction.fields.name,
        "passport_number": extraction.fields.document_number,
        "nationality": extraction.fields.nationality,
        "date_of_birth": extraction.fields.date_of_birth,
        "sex": extraction.fields.sex,
        "date_of_expiry": extraction.fields.date_of_expiry,
        "mrz_line_1": extraction.mrz.line1,
        "mrz_line_2": extraction.mrz.line2,
    }


def legacy_translated_to_canonical(translated: dict[str, Any]) -> dict[str, Any]:
    """Map translate service output (legacy keys) to canonical field keys."""
    mapping = {
        "document_type_translated": "document_type",
        "issuing_country_translated": "issuing_country",
        "surname_translated": "surname",
        "given_names_translated": "name",
        "fathers_name_translated": "fathers_name",
        "passport_number": "document_number",
        "nationality_translated": "nationality",
        "date_of_birth": "date_of_birth",
        "sex_translated": "sex",
        "place_of_birth_translated": "place_of_birth",
        "place_of_issue_translated": "place_of_issue",
        "date_of_issue": "date_of_issue",
        "date_of_expiry": "date_of_expiry",
        "issuing_authority_translated": "issuing_authority",
    }
    result: dict[str, Any] = {}
    for legacy_key, canon_key in mapping.items():
        if legacy_key in translated:
            result[canon_key] = translated[legacy_key]
    return result
