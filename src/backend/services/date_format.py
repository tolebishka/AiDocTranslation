"""Locale-aware long-form date formatting (RU / KK / EN).

Inputs are tolerant: "YYYY-MM-DD", "DD.MM.YYYY", "DD/MM/YYYY" all accepted.
If a value cannot be parsed, the original string is returned unchanged.
"""

from __future__ import annotations

import re
from datetime import date, datetime
from typing import Optional

# Month names in target locales. Index 0 is unused.
_MONTHS_RU = (
    "",
    "января", "февраля", "марта", "апреля", "мая", "июня",
    "июля", "августа", "сентября", "октября", "ноября", "декабря",
)

_MONTHS_KK = (
    "",
    "қаңтар", "ақпан", "наурыз", "сәуір", "мамыр", "маусым",
    "шілде", "тамыз", "қыркүйек", "қазан", "қараша", "желтоқсан",
)

_MONTHS_EN = (
    "",
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
)

_MONTHS_BY_LANG = {
    "ru": _MONTHS_RU,
    "rus": _MONTHS_RU,
    "russian": _MONTHS_RU,
    "kk": _MONTHS_KK,
    "kz": _MONTHS_KK,
    "kaz": _MONTHS_KK,
    "kazakh": _MONTHS_KK,
    "en": _MONTHS_EN,
    "eng": _MONTHS_EN,
    "english": _MONTHS_EN,
}


_ISO_RE = re.compile(r"^(\d{4})-(\d{1,2})-(\d{1,2})$")
_DOTTED_RE = re.compile(r"^(\d{1,2})[\./](\d{1,2})[\./](\d{4})$")


def _parse(value: str) -> Optional[date]:
    """Best-effort parse to ``date``. Returns ``None`` if not parseable."""
    s = value.strip()
    if not s:
        return None

    m = _ISO_RE.match(s)
    if m:
        y, mo, d = (int(x) for x in m.groups())
    else:
        m = _DOTTED_RE.match(s)
        if not m:
            return None
        d, mo, y = (int(x) for x in m.groups())

    try:
        return date(y, mo, d)
    except ValueError:
        return None


def format_long(value: Optional[str], language_code: str) -> Optional[str]:
    """Format a date string as ``"<day> <month_word> <year>"`` for the given lang.

    Examples:
        ``format_long("1975-10-10", "ru") -> "10 октября 1975"``
        ``format_long("1975-10-10", "kk") -> "10 қазан 1975"``
        ``format_long("10.10.1975", "en") -> "10 October 1975"``

    Falls back to the original value if it cannot be parsed.
    """
    if value is None:
        return None
    if not isinstance(value, str):
        value = str(value)

    parsed = _parse(value)
    if parsed is None:
        return value.strip() or None

    months = _MONTHS_BY_LANG.get(language_code.lower(), _MONTHS_EN)
    return f"{parsed.day} {months[parsed.month]} {parsed.year}"


def today_long(language_code: str) -> str:
    """Today's date in the long form for the given language."""
    today = datetime.now().date()
    months = _MONTHS_BY_LANG.get(language_code.lower(), _MONTHS_EN)
    return f"{today.day} {months[today.month]} {today.year}"


def format_dotted_ddmmyyyy(value: Optional[str]) -> Optional[str]:
    """Format a date string as ``DD.MM.YYYY``.

    Accepts the same inputs as :func:`format_long`. If parsing fails, returns
    the stripped original string (or ``None`` if empty).
    """
    if value is None:
        return None
    if not isinstance(value, str):
        value = str(value)
    s = value.strip()
    if not s:
        return None
    parsed = _parse(s)
    if parsed is None:
        return s or None
    return f"{parsed.day:02d}.{parsed.month:02d}.{parsed.year}"
