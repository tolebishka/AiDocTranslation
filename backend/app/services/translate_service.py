"""Translation service for passport data using OpenAI structured output."""

import json
from typing import Any, Dict

from openai import OpenAI

from core.config import OPENAI_API_KEY

client = OpenAI(api_key=OPENAI_API_KEY)


TRANSLATION_SCHEMA = {
    "name": "translated_passport_data",
    "strict": True,
    "schema": {
        "type": "object",
        "properties": {
            "document_type_translated": {"type": ["string", "null"]},
            "issuing_country_translated": {"type": ["string", "null"]},
            "surname_translated": {"type": ["string", "null"]},
            "given_names_translated": {"type": ["string", "null"]},
            "passport_number": {"type": ["string", "null"]},
            "nationality_translated": {"type": ["string", "null"]},
            "date_of_birth": {"type": ["string", "null"]},
            "sex_translated": {"type": ["string", "null"]},
            "place_of_birth_translated": {"type": ["string", "null"]},
            "place_of_issue_translated": {"type": ["string", "null"]},
            "date_of_issue": {"type": ["string", "null"]},
            "date_of_expiry": {"type": ["string", "null"]},
            "issuing_authority_translated": {"type": ["string", "null"]}
        },
        "required": [
            "document_type_translated",
            "issuing_country_translated",
            "surname_translated",
            "given_names_translated",
            "passport_number",
            "nationality_translated",
            "date_of_birth",
            "sex_translated",
            "place_of_birth_translated",
            "place_of_issue_translated",
            "date_of_issue",
            "date_of_expiry",
            "issuing_authority_translated"
        ],
        "additionalProperties": False
    }
}


def translate_passport_data(passport_data: Dict[str, Any], target_language: str) -> Dict[str, Any]:
    """
    Translate normalized passport data into a target language
    and return strict structured JSON.
    """

    system_prompt = (
        "You are a professional official-document translation assistant. "
        "Translate passport fields accurately into the target language. "
        "Preserve dates exactly as YYYY-MM-DD. "
        "Preserve passport numbers exactly. "
        "If a field is null, return null. "
        "Return only valid JSON that matches the schema."
    )

    user_prompt = f"""
Target language: {target_language}

Translate this passport data:

{json.dumps(passport_data, ensure_ascii=False, indent=2)}

Rules:
- Translate values, not keys.
- Keep passport_number unchanged.
- Keep date_of_birth, date_of_issue, date_of_expiry unchanged.
- Convert sex:
  - M -> appropriate translation for Male
  - F -> appropriate translation for Female
- document_type "P" should be translated as the natural target-language word for "Passport".
- issuing_country should be translated as the country name.
- nationality should be translated as nationality/citizenship, not simply copied from issuing_country.
- For Russian:
  - issuing_country example: "India" -> "Индия"
  - nationality example: "IND" / "Indian" -> "Гражданин Индии" or a natural official equivalent.
- Personal names should be transliterated naturally if the target language uses another script.
"Distinguish between issuing country and nationality. "
"Issuing country is the country name. "
"Nationality must be translated as a citizenship/nationality expression appropriate for the target language."
"""

    response = client.chat.completions.create(
        model="gpt-5.4-mini",
        messages=[
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt},
        ],
        response_format={
            "type": "json_schema",
            "json_schema": TRANSLATION_SCHEMA
        },
        temperature=0
    )

    content = response.choices[0].message.content
    return json.loads(content)