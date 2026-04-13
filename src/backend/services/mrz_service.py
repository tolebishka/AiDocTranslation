"""MRZ parsing service for passport documents."""

import re
from typing import Optional


def normalize_mrz_line(line: str) -> str:
    """Normalize OCR text line for MRZ parsing."""
    line = line.strip().upper().replace(" ", "")
    return line


def extract_mrz_lines(raw_text: str) -> Optional[tuple[str, str]]:
    """
    Try to extract 2 MRZ lines for TD3 passport format.
    TD3 = 2 lines, 44 chars each, usually starts with P< on line 1.
    """
    lines = [normalize_mrz_line(line) for line in raw_text.splitlines()]
    lines = [line for line in lines if line]

    for i in range(len(lines) - 1):
        line1 = lines[i]
        line2 = lines[i + 1]

        # Relaxed detection because OCR may slightly break exact length
        if line1.startswith("P<") and len(line1) >= 40 and len(line2) >= 40:
            return line1[:44].ljust(44, "<"), line2[:44].ljust(44, "<")

    return None


def format_mrz_date(date_str: str, date_kind: str = "generic") -> str:
    """
    Convert YYMMDD to YYYY-MM-DD.

    date_kind:
    - "birth": interpret future years as 1900s when needed
    - "expiry": interpret near-future years as 2000s
    - "generic": fallback heuristic
    """
    if len(date_str) != 6 or not date_str.isdigit():
        return date_str

    yy = int(date_str[:2])
    mm = date_str[2:4]
    dd = date_str[4:6]

    if date_kind == "birth":
        # Birth dates are almost always in the past
        year = 2000 + yy if yy <= 29 else 1900 + yy
    elif date_kind == "expiry":
        # Expiry dates for modern passports are almost always current/future
        year = 2000 + yy
    else:
        year = 2000 + yy if yy <= 29 else 1900 + yy

    return f"{year:04d}-{mm}-{dd}"
    """
    Convert YYMMDD to YYYY-MM-DD.
    Simple heuristic:
    - years 00-29 => 2000-2029
    - years 30-99 => 1930-1999
    """
    if len(date_str) != 6 or not date_str.isdigit():
        return date_str

    yy = int(date_str[:2])
    mm = date_str[2:4]
    dd = date_str[4:6]

    year = 2000 + yy if yy <= 29 else 1900 + yy
    return f"{year:04d}-{mm}-{dd}"


def parse_names(name_block: str) -> tuple[str, str]:
    """
    Parse surname and given names from MRZ name block.
    Example:
    AFZAL<<SAARA<<<<<<<<<<<<<<<<<<<<<<<<<<<
    """
    parts = name_block.split("<<", 1)
    surname = parts[0].replace("<", " ").strip()

    given_names = ""
    if len(parts) > 1:
        given_names = parts[1].replace("<", " ").strip()

    # Normalize multiple spaces
    surname = re.sub(r"\s+", " ", surname)
    given_names = re.sub(r"\s+", " ", given_names)

    return surname, given_names


def compute_check_digit(data: str) -> str:
    """
    Compute MRZ check digit according to ICAO 9303.
    Weights cycle: 7, 3, 1
    """
    weights = [7, 3, 1]
    total = 0

    for i, char in enumerate(data):
        if "0" <= char <= "9":
            value = ord(char) - ord("0")
        elif "A" <= char <= "Z":
            value = ord(char) - ord("A") + 10
        elif char == "<":
            value = 0
        else:
            value = 0

        total += value * weights[i % 3]

    return str(total % 10)


def validate_check_digit(data: str, check_digit: str) -> bool:
    """Validate one MRZ check digit."""
    if not check_digit or check_digit == "<":
        return False
    return compute_check_digit(data) == check_digit


def parse_td3_mrz(line1: str, line2: str) -> dict:
    """
    Parse TD3 passport MRZ (2 lines x 44 chars).
    """
    line1 = normalize_mrz_line(line1).ljust(44, "<")[:44]
    line2 = normalize_mrz_line(line2).ljust(44, "<")[:44]

    document_type = line1[0]
    issuing_country = line1[2:5]

    name_block = line1[5:]
    surname_latin, given_names_latin = parse_names(name_block)

    passport_number_raw = line2[0:9]
    passport_number = passport_number_raw.replace("<", "")

    passport_number_check = line2[9]

    nationality = line2[10:13]

    birth_date_raw = line2[13:19]
    birth_date_check = line2[19]

    sex = line2[20]
    if sex == "<":
        sex = ""

    expiry_date_raw = line2[21:27]
    expiry_date_check = line2[27]

    optional_data = line2[28:42]
    optional_data_check = line2[42]
    final_check = line2[43]

    # Composite string for final check digit in TD3
    composite_data = (
        line2[0:10] +   # passport number + check
        line2[13:20] +  # birth date + check
        line2[21:28] +  # expiry date + check
        line2[28:43]    # optional data + check
    )

    validations = {
        "passport_number_valid": validate_check_digit(passport_number_raw, passport_number_check),
        "birth_date_valid": validate_check_digit(birth_date_raw, birth_date_check),
        "expiry_date_valid": validate_check_digit(expiry_date_raw, expiry_date_check),
        "optional_data_valid": validate_check_digit(optional_data, optional_data_check),
        "final_check_valid": validate_check_digit(composite_data, final_check),
    }

    return {
        "mrz_type": "TD3",
        "document_type": document_type,
        "issuing_country": issuing_country,
        "surname_latin": surname_latin,
        "given_names_latin": given_names_latin,
        "passport_number": passport_number,
        "nationality": nationality,
        "date_of_birth": format_mrz_date(birth_date_raw, "birth"),
        "sex": sex,
        "date_of_expiry": format_mrz_date(expiry_date_raw, "expiry"),
        "optional_data": optional_data.replace("<", "").strip(),
        "mrz_line_1": line1,
        "mrz_line_2": line2,
        "validations": validations,
    }


def parse_mrz_from_text(raw_text: str) -> Optional[dict]:
    """
    Extract and parse MRZ from OCR raw text.
    Currently supports TD3 passport only.
    """
    mrz_lines = extract_mrz_lines(raw_text)

    if not mrz_lines:
        return None

    line1, line2 = mrz_lines

    if line1.startswith("P<"):
        return parse_td3_mrz(line1, line2)

    return None