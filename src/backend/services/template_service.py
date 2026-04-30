"""Document template registry and renderer.

Templates live on disk under ``backend/templates/<id>/`` with two files:

- ``manifest.json`` — metadata, declared languages, country code/aliases
- ``template.docx`` — Word document with Jinja-style placeholders
  (e.g. ``{{ ru.surname }}``)

This module:

- discovers and parses manifests at request time (cheap, no caching needed for
  a few dozen entries; reread on every call so editing manifests during dev
  doesn't require a restart)
- builds a per-language context from the canonical extraction + an optional
  set of user-edited primary translations
- renders ``template.docx`` with ``docxtpl`` and writes the result to
  ``GENERATED_DIR``
"""

from __future__ import annotations

import json
import logging
import os
import time
import uuid
from dataclasses import dataclass
from typing import Any, Dict, Iterable, List, Optional

from docxtpl import DocxTemplate, RichText

from backend.core.config import (
    GENERATED_DIR,
    GENERATED_TTL_SECONDS,
    TEMPLATES_DIR,
)
from backend.core.errors import AppError
from backend.services.date_format import format_dotted_ddmmyyyy, format_long, today_long
from backend.services.translate_service import translate_passport_data

logger = logging.getLogger(__name__)

os.makedirs(GENERATED_DIR, exist_ok=True)


# ---------------------------------------------------------------------------
# Manifest model
# ---------------------------------------------------------------------------

@dataclass(frozen=True)
class TemplateLanguage:
    code: str           # e.g. "ru"
    name: str           # e.g. "Russian" — must match the translator vocabulary


@dataclass(frozen=True)
class TemplateMeta:
    id: str
    folder: str
    file: str
    country_code: Optional[str]
    country_aliases: tuple[str, ...]
    name: Dict[str, str]              # localized display names
    description: str
    languages: tuple[TemplateLanguage, ...]
    version: str
    formatting: Dict[str, Any]

    @property
    def docx_path(self) -> str:
        return os.path.join(self.folder, self.file)

    def to_public_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "country_code": self.country_code,
            "country_aliases": list(self.country_aliases),
            "name": dict(self.name),
            "description": self.description,
            "languages": [{"code": l.code, "name": l.name} for l in self.languages],
            "version": self.version,
        }


def _parse_manifest(path: str) -> Optional[TemplateMeta]:
    try:
        with open(path, "r", encoding="utf-8") as fh:
            data = json.load(fh)
    except Exception:
        logger.warning("Failed to read manifest at %s", path)
        return None

    folder = os.path.dirname(path)
    languages = tuple(
        TemplateLanguage(code=str(l["code"]).strip(), name=str(l["name"]).strip())
        for l in data.get("languages", [])
        if l.get("code") and l.get("name")
    )

    fmt = data.get("formatting")
    formatting: Dict[str, Any] = dict(fmt) if isinstance(fmt, dict) else {}

    return TemplateMeta(
        id=str(data.get("id", "")).strip(),
        folder=folder,
        file=str(data.get("file", "template.docx")),
        country_code=(data.get("country_code") or "").strip().upper() or None,
        country_aliases=tuple(
            s.strip() for s in data.get("country_aliases", []) if isinstance(s, str)
        ),
        name=dict(data.get("name", {})),
        description=str(data.get("description", "")),
        languages=languages,
        version=str(data.get("version", "0.0.0")),
        formatting=formatting,
    )


def list_templates() -> List[TemplateMeta]:
    """Discover all manifests under ``TEMPLATES_DIR``."""
    if not os.path.isdir(TEMPLATES_DIR):
        return []

    out: List[TemplateMeta] = []
    for entry in sorted(os.listdir(TEMPLATES_DIR)):
        sub = os.path.join(TEMPLATES_DIR, entry)
        manifest = os.path.join(sub, "manifest.json")
        if not os.path.isfile(manifest):
            continue
        meta = _parse_manifest(manifest)
        if meta and meta.id:
            out.append(meta)
    return out


def get_template(template_id: str) -> TemplateMeta:
    for tpl in list_templates():
        if tpl.id == template_id:
            return tpl
    raise AppError(
        "template_not_found",
        f"Template '{template_id}' is not registered",
        404,
    )


def filter_templates_for_country(country: Optional[str]) -> List[TemplateMeta]:
    """Return templates whose country_code or alias matches the given hint.

    ``country`` may be an ISO-3 code, a localized country name, or a place name
    that was returned by OCR. Match is case-insensitive and substring-based.
    Returns the full list when no hint is given.
    """
    everything = list_templates()
    if not country:
        return everything

    needle = country.strip().lower()
    if not needle:
        return everything

    matches: List[TemplateMeta] = []
    for tpl in everything:
        if tpl.country_code and tpl.country_code.lower() == needle:
            matches.append(tpl)
            continue
        for alias in tpl.country_aliases:
            if alias.lower() in needle or needle in alias.lower():
                matches.append(tpl)
                break
    return matches or everything


# ---------------------------------------------------------------------------
# Context builders
# ---------------------------------------------------------------------------

# Translator output keys -> short context keys exposed in templates
_FIELD_MAP = {
    "document_type_translated":     "document_type",
    "issuing_country_translated":   "issuing_country",
    "surname_translated":           "surname",
    "given_names_translated":       "given_names",
    "fathers_name_translated":      "fathers_name",
    "passport_number":              "passport_number",
    "nationality_translated":       "nationality",
    "date_of_birth":                "date_of_birth",
    "sex_translated":               "sex",
    "place_of_birth_translated":    "place_of_birth",
    "place_of_issue_translated":    "place_of_issue",
    "date_of_issue":                "date_of_issue",
    "date_of_expiry":               "date_of_expiry",
    "issuing_authority_translated": "issuing_authority",
}

# Keys whose values are free text and may be uppercased for official layouts
_UPPERCASE_TEXT_KEYS = frozenset(
    {
        "document_type",
        "issuing_country",
        "surname",
        "given_names",
        "fathers_name",
        "nationality",
        "place_of_birth",
        "place_of_issue",
        "issuing_authority",
        "sex",
    }
)


def _expand_mvd_authority_ru(value: str) -> str:
    """Turn ``МВД 26283`` into the full ministry line used on Uzbek layouts."""
    s = (value or "").strip()
    if not s:
        return s
    low = s.lower()
    if low.startswith("мвд"):
        tail = s[3:].strip().lstrip(",:;")
        return f"МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ, {tail}".strip().rstrip(",")
    return s


def _sex_one_letter_ru(translated: str, original_sex: str) -> str:
    """Map verbose sex / MRZ letters to a single Cyrillic letter ``Ж`` / ``М``."""
    t = (translated or "").strip().lower()
    o = (original_sex or "").strip().upper()
    # MRZ uses Latin F/M; layout uses Cyrillic Ж/М
    if o == "M" or o == "\u041c":  # Latin M or Cyrillic М
        return "\u041c"
    if o == "F" or o == "\u0416":
        return "\u0416"
    if t.startswith("ж") or "жен" in t or "female" in t or t in ("f", "ж"):
        return "\u0416"
    if t.startswith("м") or "муж" in t or "male" in t or t in ("m", "м"):
        return "\u041c"
    if len(translated or "") == 1:
        ch = (translated or "").strip().upper()
        if ch == "M":
            return "\u041c"
        if ch == "F":
            return "\u0416"
        if ch in ("\u041c", "\u0416"):
            return ch
    return (translated or "").strip()[:1].upper() if translated else ""


def _uppercase_text_value(key: str, value: str) -> str:
    """Uppercase human-readable fields; leave passport numbers as-is."""
    if key not in _UPPERCASE_TEXT_KEYS or not value:
        return value
    return value.upper()


def _apply_template_formatting(
    ctx: Dict[str, Any],
    lang_code: str,
    formatting: Dict[str, Any],
    original_sex: str,
) -> None:
    """Mutates ``ctx`` according to optional manifest ``formatting`` rules."""
    if not formatting:
        return

    ndisp = formatting.get("nationality_display")
    if isinstance(ndisp, dict):
        rep = ndisp.get(lang_code)
        if isinstance(rep, str) and rep.strip():
            ctx["nationality"] = rep.strip()

    if formatting.get("expand_mvd_authority"):
        ctx["issuing_authority"] = _expand_mvd_authority_ru(ctx.get("issuing_authority") or "")

    if formatting.get("sex_letter_style") == "ru":
        ctx["sex"] = _sex_one_letter_ru(ctx.get("sex") or "", original_sex)

    if formatting.get("date_style") == "dd.mm.yyyy":
        for dk in ("date_of_birth", "date_of_issue", "date_of_expiry"):
            dotted = format_dotted_ddmmyyyy(ctx.get(dk) or None)
            if dotted:
                ctx[dk] = dotted

    if formatting.get("uppercase_text") is True:
        for key in list(ctx.keys()):
            if key.endswith("_long"):
                continue
            if not isinstance(ctx[key], str):
                continue
            ctx[key] = _uppercase_text_value(key, ctx[key])


def _mrz_ascii_name_part(raw: str) -> str:
    """Keep A–Z and digits; spaces/hyphens become '<' (ICAO MRZ filler)."""
    buf: List[str] = []
    for ch in (raw or "").upper():
        if "A" <= ch <= "Z" or ch.isdigit():
            buf.append(ch)
        elif ch.isspace() or ch in "-–—/":
            if buf and buf[-1] != "<":
                buf.append("<")
    return "".join(buf).strip("<")


def _build_td3_line1(
    issuing_country: str,
    surname: str,
    given_names: str,
    fathers_name: str,
) -> str:
    """Synthesize TD3 MRZ line 1 (44 chars) when OCR only captured line 2."""
    st = (issuing_country or "XXX").strip().upper()
    if len(st) < 3:
        st = (st + "XXX")[:3]
    else:
        st = st[:3]

    sur = _mrz_ascii_name_part(surname)
    giv = _mrz_ascii_name_part(given_names)
    pat = _mrz_ascii_name_part(fathers_name)
    secondary = "<".join(p for p in (giv, pat) if p)

    if sur or secondary:
        name_field = f"{sur}<<{secondary}" if secondary else f"{sur}<<"
    else:
        name_field = "<<"

    if len(name_field) > 39:
        name_field = name_field[:39]
    else:
        name_field = name_field + ("<" * (39 - len(name_field)))

    return ("P<" + st + name_field)[:44].ljust(44, "<")


def _flatten_translation(
    payload: Dict[str, Any],
    lang_code: str,
    formatting: Dict[str, Any],
    original_sex: str,
) -> Dict[str, Any]:
    """Convert the translator payload into the per-language template context.

    Applies optional manifest ``formatting`` rules, then adds ``*_long`` date
    companions. Missing values become empty strings.
    """
    ctx: Dict[str, Any] = {}
    for src, dst in _FIELD_MAP.items():
        value = payload.get(src)
        ctx[dst] = "" if value in (None, "") else str(value)

    _apply_template_formatting(ctx, lang_code, formatting, original_sex)

    for date_key in ("date_of_birth", "date_of_issue", "date_of_expiry"):
        ctx[f"{date_key}_long"] = format_long(ctx.get(date_key) or None, lang_code) or ""

    return ctx


def _str(value: Any) -> str:
    """Coerce to trimmed string, mapping ``None`` to empty."""
    if value is None:
        return ""
    return str(value).strip()


def _mrz_display_richtext(mb: Dict[str, str]) -> str | RichText:
    """RichText for MRZ (chevrons ``<``). Use in Word: ``{{r MRZ }}`` (note the ``r``).

    Plain ``{{ MRZ }}`` breaks WordprocessingML because ``<`` starts an XML tag.

    Runs are **bold** monospace (Courier New): MRZ is fixed-width; long runs of
    ``<`` at the end are ICAO padding to 44 characters per line, not typos.
    """
    lines = [p for p in (mb.get("line1"), mb.get("line2"), mb.get("line3")) if p]
    if not lines:
        return ""
    rt = RichText()
    for i, line in enumerate(lines):
        if i:
            rt.xml += "<w:r><w:br/></w:r>"
        rt.add(line, font="Times New Roman", bold=True)
    return rt


def _mrz_block(extraction: Dict[str, Any]) -> Dict[str, str]:
    """Expose MRZ to the template as a small mapping.

    ``combined`` joins the two lines with a newline so authors can drop a
    single placeholder into a paragraph and let the renderer keep the line
    break. ``type`` is detected from line lengths (TD1/TD2/TD3) and is empty
    when no MRZ was parsed.
    """
    mrz = (extraction or {}).get("mrz") or {}
    line1 = _str(mrz.get("line1"))
    line2 = _str(mrz.get("line2"))
    line3 = _str(mrz.get("line3"))

    # TD3: OCR often captures only line 2; rebuild line 1 from Latin name fields.
    if not line1 and len(line2) == 44:
        ob = _original_block(extraction)
        synth = _build_td3_line1(
            ob["issuing_country"],
            ob["surname"],
            ob["given_names"],
            ob["fathers_name"],
        )
        if synth:
            line1 = synth

    parts = [p for p in (line1, line2, line3) if p]
    combined = "\n".join(parts)

    mrz_type = ""
    if len(parts) == 2 and all(len(p) == 44 for p in parts):
        mrz_type = "TD3"
    elif len(parts) == 2 and all(len(p) == 36 for p in parts):
        mrz_type = "TD2"
    elif len(parts) == 3 and all(len(p) == 30 for p in parts):
        mrz_type = "TD1"

    return {
        "line1": line1,
        "line2": line2,
        "line3": line3,
        "combined": combined,
        "type": mrz_type,
    }


def _original_block(extraction: Dict[str, Any]) -> Dict[str, str]:
    """Latin / OCR originals, untranslated. Useful for trilingual layouts."""
    fields = (extraction or {}).get("fields") or {}
    return {
        "document_type":     _str((extraction or {}).get("document_type")),
        "issuing_country":   _str((extraction or {}).get("country")),
        "surname":           _str(fields.get("surname")),
        "given_names":       _str(fields.get("name")),
        "fathers_name":      _str(fields.get("fathers_name")),
        "passport_number":   _str(fields.get("document_number")),
        "nationality":       _str(fields.get("nationality")),
        "date_of_birth":     _str(fields.get("date_of_birth")),
        "sex":               _str(fields.get("sex")),
        "place_of_birth":    _str(fields.get("place_of_birth")),
        "place_of_issue":    _str(fields.get("place_of_issue")),
        "date_of_issue":     _str(fields.get("date_of_issue")),
        "date_of_expiry":    _str(fields.get("date_of_expiry")),
        "issuing_authority": _str(fields.get("issuing_authority")),
    }


def _legacy_payload_from_extraction(extraction: Dict[str, Any]) -> Dict[str, Any]:
    """Build the same dict shape ``extraction_to_legacy_passport`` produces.

    Implemented locally here to avoid pulling the adapter (and to keep this
    service decoupled from request schemas). Mirrors keys that the translator
    expects.
    """
    fields = (extraction or {}).get("fields") or {}
    return {
        "document_type": (extraction or {}).get("document_type"),
        "issuing_country": (extraction or {}).get("country"),
        "surname": fields.get("surname"),
        "given_names": fields.get("name"),
        "fathers_name": fields.get("fathers_name"),
        "passport_number": fields.get("document_number"),
        "nationality": fields.get("nationality"),
        "date_of_birth": fields.get("date_of_birth"),
        "sex": fields.get("sex"),
        "place_of_birth": fields.get("place_of_birth"),
        "place_of_issue": fields.get("place_of_issue"),
        "date_of_issue": fields.get("date_of_issue"),
        "date_of_expiry": fields.get("date_of_expiry"),
        "issuing_authority": fields.get("issuing_authority"),
    }


def build_context(
    *,
    template: TemplateMeta,
    extraction: Dict[str, Any],
    primary_language: Optional[str],
    primary_overrides: Optional[Dict[str, Any]],
) -> Dict[str, Any]:
    """Compose the Jinja context for ``template``.

    For each language declared in the template manifest we either reuse the
    user-edited primary translation (when its language matches) or call the
    translator service fresh.
    """
    legacy = _legacy_payload_from_extraction(extraction)
    fields = (extraction or {}).get("fields") or {}
    original_sex = _str(fields.get("sex"))
    fmt = template.formatting or {}

    ctx: Dict[str, Any] = {}
    for lang in template.languages:
        if (
            primary_language
            and primary_overrides
            and primary_language.strip().lower() == lang.name.strip().lower()
        ):
            ctx[lang.code] = _flatten_translation(
                primary_overrides, lang.code, fmt, original_sex
            )
            continue

        translated = translate_passport_data(legacy, lang.name)
        ctx[lang.code] = _flatten_translation(translated, lang.code, fmt, original_sex)

    mb = _mrz_block(extraction)
    ctx["mrz"] = mb
    # RichText for ICAO "<" fillers — template must use {{r MRZ }} (raw XML), not {{ MRZ }}.
    ctx["MRZ"] = _mrz_display_richtext(mb)
    ctx["original"] = _original_block(extraction)
    ctx["today"] = {l.code: today_long(l.code) for l in template.languages}
    ctx["generated_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
    return ctx


# ---------------------------------------------------------------------------
# Renderer
# ---------------------------------------------------------------------------

def cleanup_generated() -> None:
    """Delete generated files older than ``GENERATED_TTL_SECONDS``."""
    if not os.path.isdir(GENERATED_DIR):
        return
    now = time.time()
    for filename in os.listdir(GENERATED_DIR):
        path = os.path.join(GENERATED_DIR, filename)
        if not os.path.isfile(path) or filename.startswith("."):
            continue
        try:
            if now - os.path.getmtime(path) > GENERATED_TTL_SECONDS:
                os.remove(path)
        except OSError:
            continue


def render_template(template: TemplateMeta, context: Dict[str, Any]) -> Dict[str, str]:
    """Render ``template.docx`` with ``context`` and write to GENERATED_DIR."""
    if not os.path.isfile(template.docx_path):
        raise AppError(
            "template_file_missing",
            f"Template '{template.id}' has no template.docx yet. "
            "Add the .docx file to its folder and try again.",
            422,
        )

    try:
        tpl = DocxTemplate(template.docx_path)
        tpl.render(context)
    except Exception as exc:
        logger.warning("Template render failed for %s: %s", template.id, type(exc).__name__)
        raise AppError(
            "template_render_failed",
            "Couldn't fill the template. Check that placeholders are not split "
            "across runs (e.g. retype them in Word).",
            422,
        ) from exc

    document_id = uuid.uuid4().hex
    out_name = f"{template.id}__{document_id}.docx"
    out_path = os.path.join(GENERATED_DIR, out_name)
    tpl.save(out_path)

    return {
        "document_id": document_id,
        "stored_as": out_name,
        "file_path": out_path,
    }


def get_generated_path(document_id: str) -> Optional[str]:
    if not os.path.isdir(GENERATED_DIR):
        return None
    suffix = f"__{document_id}.docx"
    for filename in os.listdir(GENERATED_DIR):
        if filename.endswith(suffix):
            return os.path.join(GENERATED_DIR, filename)
    return None


def declared_languages(templates: Iterable[TemplateMeta]) -> List[str]:
    """Distinct language *names* across the given templates (preserves order)."""
    seen: Dict[str, None] = {}
    for tpl in templates:
        for lang in tpl.languages:
            seen.setdefault(lang.name, None)
    return list(seen.keys())
