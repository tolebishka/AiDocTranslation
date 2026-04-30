# Templates

Each subfolder is one document template:

```
templates/
└── china/
    ├── manifest.json   # metadata + which placeholders to fill
    └── template.docx   # Word file authored by a human (with {{ jinja }} placeholders)
```

The backend reads `manifest.json` files at startup time. Adding a new country is
done by creating a new folder with the two files. No code changes needed.

## Manifest fields

```json
{
  "id": "china_public_relations",
  "country_code": "CHN",
  "country_aliases": ["China", "Китай", "ҚЫТАЙ"],
  "name": {
    "Russian": "...",
    "Kazakh": "...",
    "English": "..."
  },
  "description": "Двуязычный перевод (русский + казахский)",
  "languages": [
    { "code": "ru", "name": "Russian" },
    { "code": "kk", "name": "Kazakh" }
  ],
  "file": "template.docx",
  "version": "1.0.0"
}
```

- `country_code` — ISO-3 (matches what MRZ produces). Used to filter templates
  for the detected country on the frontend.
- `country_aliases` — extra strings (case-insensitive) that we also consider a
  match for this country (helpful when OCR returns a localized country name).
- `languages` — declares which locales the template embeds. Each entry produces
  a top-level Jinja namespace (`{{ ru.surname }}`, `{{ kk.surname }}`, ...).
- `file` — name of the .docx file in this folder.

## Optional `formatting` block (manifest)

Some layouts expect **all-caps** text, **DD.MM.YYYY** dates, a **single-letter**
sex, a full **issuing authority** line, or a fixed **citizenship** label. Add an
optional `formatting` object to `manifest.json` (see `uzbekistan/manifest.json`):

| Key | Effect |
| --- | --- |
| `uppercase_text` | Uppercase human-readable fields (`surname`, `nationality`, …); passport number is left as-is. |
| `date_style` | Set to `"dd.mm.yyyy"` to rewrite `date_of_birth`, `date_of_issue`, `date_of_expiry` (and refresh `*_long`). |
| `sex_letter_style` | Set to `"ru"` for a single Cyrillic letter **Ж** / **М** (uses MRZ `F`/`M` from extraction when needed). |
| `expand_mvd_authority` | Replace a short `МВД …` line with `МИНИСТЕРСТВО ВНУТРЕННИХ ДЕЛ, …`. |
| `nationality_display` | Map of language code → exact citizenship string (e.g. `"ru": "УЗБЕКИСТАН"`). |

## Available placeholders inside `template.docx`

For every language declared in `manifest.json` the renderer exposes the same
field set. Use **dot syntax**: `{{ <lang>.<field> }}`. For example, with
languages `ru` + `kk` you can write:

| Placeholder              | Meaning                                            |
| ------------------------ | -------------------------------------------------- |
| `{{ ru.surname }}`       | Last name (translated/transliterated)              |
| `{{ ru.given_names }}`   | First name(s)                                      |
| `{{ ru.fathers_name }}`  | Patronymic (may be empty)                          |
| `{{ ru.document_type }}` | Document type (e.g. "паспорт")                     |
| `{{ ru.issuing_country }}` | Country name in the target language              |
| `{{ ru.nationality }}`   | Nationality / citizenship phrase                   |
| `{{ ru.sex }}`           | Sex word (e.g. "М" / "мужской")                    |
| `{{ ru.passport_number }}` | Passport number (kept as-is)                     |
| `{{ ru.date_of_birth }}` | Date of birth, ISO-ish (e.g. `1975-10-10`)         |
| `{{ ru.date_of_birth_long }}`  | "10 октября 1975"                            |
| `{{ ru.date_of_issue }}` | Date of issue, ISO-ish                             |
| `{{ ru.date_of_issue_long }}`  | Long form                                    |
| `{{ ru.date_of_expiry }}` | Date of expiry, ISO-ish                           |
| `{{ ru.date_of_expiry_long }}` | Long form                                    |
| `{{ ru.place_of_birth }}` | Place of birth                                    |
| `{{ ru.place_of_issue }}` | Place of issue                                    |
| `{{ ru.issuing_authority }}` | Issuing authority                              |

Top-level helpers:

| Placeholder           | Meaning                                          |
| --------------------- | ------------------------------------------------ |
| `{{ today.ru }}`      | Today's date in the long Russian form            |
| `{{ today.kk }}`      | Today's date in the long Kazakh form             |
| `{{ today.en }}`      | Today's date in the long English form            |
| `{{ generated_at }}`  | ISO timestamp                                    |

## MRZ block (always available, language-agnostic)

The machine-readable zone is exposed under a top-level ``mrz`` namespace —
not under language namespaces, since MRZ is always Latin and identical across
locales:

| Placeholder           | Meaning                                              |
| --------------------- | ---------------------------------------------------- |
| `{{ mrz.line1 }}`     | First MRZ line (TD3). If OCR only returned line 2, the server **synthesizes** line 1 from Latin `original.*` names when possible. |
| `{{ mrz.line2 }}`     | Second MRZ line                                      |
| `{{ mrz.line3 }}`     | Third MRZ line (TD1 only; empty for TD2/TD3)         |
| `{{ mrz.combined }}`  | All non-empty lines joined with a newline (plain text; Word may show one line). |
| `{{ MRZ }}`           | **Do not use** for real MRZ: ``<`` breaks Word XML. Use ``{{r MRZ }}`` instead. |
| `{{r MRZ }}`         | **Required** for MRZ: inserts :class:`~docxtpl.RichText` (Times New Roman + line break). Same two lines as ``mrz.combined``. |
| `{{ mrz.type }}`      | `"TD1"`, `"TD2"`, `"TD3"` or empty                   |

For the bottom MRZ block, use **exactly** (letter ``r`` + space before ``}}``):

```
{{r MRZ }}
```

Do **not** use `{{ MRZ }}` — the first MRZ line contains ``<`` characters; Word would
eat them as broken XML and the zone disappears or looks empty.

Do not split `{{ mrz.line1 }}` / `{{ mrz.line2 }}` unless you prefer manual layout.

## Original (Latin / OCR) values, untranslated

If your layout shows the source text alongside the translation (e.g.
"Surname / Фамилия / Тегі"), use the ``original`` namespace. These values
come straight from MRZ + OCR, never run through the translator:

| Placeholder                       | Meaning                              |
| --------------------------------- | ------------------------------------ |
| `{{ original.surname }}`          | Latin surname (`GUO`)                |
| `{{ original.given_names }}`      | Latin given names (`YUN`)            |
| `{{ original.fathers_name }}`     | Patronymic if present                |
| `{{ original.document_type }}`    | `P` / `ID` / etc                     |
| `{{ original.issuing_country }}`  | ISO-3 / OCR country (`CHN`)          |
| `{{ original.passport_number }}`  | Same as `{{ ru.passport_number }}`   |
| `{{ original.nationality }}`      | `CHN`                                |
| `{{ original.date_of_birth }}`    | `1975-10-10`                         |
| `{{ original.sex }}`              | `M` / `F`                            |
| `{{ original.place_of_birth }}`   | OCR value, e.g. `JIANGXI`            |
| `{{ original.place_of_issue }}`   | OCR value                            |
| `{{ original.date_of_issue }}`    | `2024-04-22`                         |
| `{{ original.date_of_expiry }}`   | `2029-04-22`                         |
| `{{ original.issuing_authority }}`| OCR value, e.g. `MFA, BEIJING`       |

## Authoring tips (read this before editing in Word)

- Word silently splits text into multiple "runs" when formatting changes
  mid-word. If you do `Find & Replace` to insert a placeholder, **the
  placeholder almost certainly breaks**: Jinja sees `{{ surn` ... `ame }}`
  and refuses to render.
- The reliable workflow is:
  1. Select the literal value in the document (e.g. the surname "ГО").
  2. Press **Delete** so the cell/line is empty in that spot.
  3. **Type** the placeholder by hand: `{{ ru.surname }}`.
- Avoid pasting placeholders from a different program — fonts/styles may
  reintroduce splits. If unsure, retype.
- Spaces in `{{ ru.surname }}` matter: `{{ru.surname}}` works too, but be
  consistent within one document.
- For two-language documents (RU + KK), keep the namespaces strict:
  the Russian half uses `{{ ru.* }}`, the Kazakh half uses `{{ kk.* }}`.
