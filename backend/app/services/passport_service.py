"""Passport data extraction service combining MRZ + OCR."""

import re
from typing import Optional


MONTHS = {
    "JAN": "01",
    "FEB": "02",
    "MAR": "03",
    "APR": "04",
    "MAY": "05",
    "JUN": "06",
    "JUL": "07",
    "AUG": "08",
    "SEP": "09",
    "OCT": "10",
    "NOV": "11",
    "DEC": "12",
}


def normalize_ocr_text(ocr_text: str) -> str:
    """Normalize OCR text for easier parsing."""
    return ocr_text.replace("\r", "\n")


def normalize_text_date(date_str: str) -> Optional[str]:
    """
    Normalize OCR date to YYYY-MM-DD.
    Supported:
    - 15 JUL 2024
    - 01/12/2021
    - 30-11-2031
    """
    if not date_str:
        return None

    date_str = date_str.strip().upper()

    # Format: 15 JUL 2024
    match_text = re.match(r"^(\d{1,2})\s+([A-Z]{3})\s+(\d{4})$", date_str)
    if match_text:
        day, month_abbr, year = match_text.groups()
        month = MONTHS.get(month_abbr)
        if month:
            return f"{year}-{month}-{int(day):02d}"

    # Format: 01/12/2021 or 30-11-2031
    match_numeric = re.match(r"^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$", date_str)
    if match_numeric:
        day, month, year = match_numeric.groups()
        return f"{year}-{int(month):02d}-{int(day):02d}"

    return None


def extract_labeled_value(lines: list[str], label_keywords: list[str]) -> Optional[str]:
    """
    Find a line containing one of the label keywords,
    then return the next non-empty meaningful line.
    """
    for i, line in enumerate(lines):
        line_upper = line.upper()

        if any(keyword in line_upper for keyword in label_keywords):
            for j in range(i + 1, min(i + 5, len(lines))):
                candidate = lines[j].strip()
                candidate_upper = candidate.upper()

                if not candidate:
                    continue

                # skip obvious labels
                if any(k in candidate_upper for k in [
                    "PASSPORT", "PASSEPORT", "PASAPORTE",
                    "TYPE", "CODE", "SURNAME", "GIVEN NAME", "GIVEN NAMES",
                    "NATIONALITY", "DATE OF BIRTH", "SEX",
                    "PLACE OF BIRTH", "PLACE OF ISSUE",
                    "DATE OF ISSUE", "DATE OF EXPIRATION", "DATE OF EXPIRY",
                    "AUTHORITY",
                ]):
                    continue

                if len(candidate) < 2:
                    continue

                return candidate

    return None


def extract_date_after_label(lines: list[str], label_keywords: list[str]) -> Optional[str]:
    raw_value = extract_labeled_value(lines, label_keywords)
    return normalize_text_date(raw_value) if raw_value else None


def extract_place_of_birth(lines: list[str]) -> Optional[str]:
    return extract_labeled_value(
        lines,
        [
            "PLACE OF BIRTH",
            "LIEU DE NAISS",
            "LUGAR DE NACIMIENTO",
            "जन्म स्थान",
        ],
    )


def extract_place_of_issue(lines: list[str]) -> Optional[str]:
    return extract_labeled_value(
        lines,
        [
            "PLACE OF ISSUE",
            "जारी करने का स्थान",
        ],
    )


def extract_issuing_authority(lines: list[str]) -> Optional[str]:
    return extract_labeled_value(
        lines,
        [
            "AUTHORITY",
            "AUTORIT",
            "AUTORIDAD",
        ],
    )


def extract_date_of_issue(lines: list[str]) -> Optional[str]:
    return extract_date_after_label(
        lines,
        [
            "DATE OF ISSUE",
            "DATE OF DÉLIV",
            "FECHA DE EXPED",
            "जारी करने की तिथि",
        ],
    )


def build_passport_data(mrz_fields: dict | None, ocr_text: str) -> dict:
    """
    Combine MRZ + OCR fields into one unified passport JSON.
    MRZ = source of truth for core fields.
    OCR = supplemental fields.
    """
    normalized_text = normalize_ocr_text(ocr_text)
    lines = [line.strip() for line in normalized_text.splitlines() if line.strip()]

    passport_data = {
        "document_type": None,
        "issuing_country": None,
        "surname_latin": None,
        "given_names_latin": None,
        "passport_number": None,
        "nationality": None,
        "date_of_birth": None,
        "sex": None,
        "place_of_birth": None,
        "place_of_issue": None,
        "date_of_issue": None,
        "date_of_expiry": None,
        "issuing_authority": None,
    }

    if mrz_fields:
        passport_data.update({
            "document_type": mrz_fields.get("document_type"),
            "issuing_country": mrz_fields.get("issuing_country"),
            "surname_latin": mrz_fields.get("surname_latin"),
            "given_names_latin": mrz_fields.get("given_names_latin"),
            "passport_number": mrz_fields.get("passport_number"),
            "nationality": mrz_fields.get("nationality"),
            "date_of_birth": mrz_fields.get("date_of_birth"),
            "sex": mrz_fields.get("sex"),
            "date_of_expiry": mrz_fields.get("date_of_expiry"),
        })

    passport_data["place_of_birth"] = extract_place_of_birth(lines)
    passport_data["place_of_issue"] = extract_place_of_issue(lines)
    passport_data["date_of_issue"] = extract_date_of_issue(lines)
    passport_data["issuing_authority"] = extract_issuing_authority(lines)

    return passport_data