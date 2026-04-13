"""
Personal name normalization for extraction.

Splits given-name + patronymic when the patronymic is clearly identified
by suffix patterns (e.g. -ovna, -evna, -ovich, -evich).
Conservative: only splits when we have a strong signal to avoid breaking
Western names like "MARY JANE" or "JOHN PAUL".
"""

import re
from typing import Tuple

# Patronymic suffixes (Slavic / Central Asian). Case-insensitive.
# Female: -ovna, -evna; Male: -ovich, -evich
# Excludes -ova/-eva to avoid splitting surnames (e.g. Ivanova).
_PATRONYMIC_SUFFIXES = ("ovna", "evna", "ovich", "evich")


def _has_patronymic_suffix(word: str) -> bool:
    """True if word ends with a known patronymic suffix."""
    if not word or len(word) < 5:
        return False
    w = word.lower()
    return any(w.endswith(suffix) for suffix in _PATRONYMIC_SUFFIXES)


def split_name_and_patronymic(given_names: str | None) -> Tuple[str | None, str | None]:
    """
    Split "GIVEN_NAME PATRONYMIC" into (name, fathers_name) when patronymic is detected.

    Heuristic: if given_names has 2+ parts and the LAST part ends with a patronymic
    suffix (-ovna, -evna, -ovich, -evich), treat it as fathers_name.

    Examples:
      "FLYURA TEMIROVNA" -> ("FLYURA", "TEMIROVNA")
      "ANNA IVANOVNA" -> ("ANNA", "IVANOVNA")
      "JOHN MICHAEL" -> ("JOHN MICHAEL", None)  # no suffix, do not split
      "MARY" -> ("MARY", None)

    Returns:
      (name, fathers_name) - fathers_name is None when no patronymic detected.
    """
    if not given_names or not given_names.strip():
        return (given_names, None)

    given_names = given_names.strip()
    parts = re.split(r"\s+", given_names)

    if len(parts) < 2:
        return (given_names, None)

    last = parts[-1]
    if not _has_patronymic_suffix(last):
        return (given_names, None)

    name = " ".join(parts[:-1]).strip()
    fathers_name = last
    return (name or None, fathers_name)
