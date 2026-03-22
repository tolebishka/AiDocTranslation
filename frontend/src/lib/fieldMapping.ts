import type {
  ExtractionFields,
  ExtractionResult,
  TranslatedPassportData,
} from "../types/api";

/** One logical row in the comparison table */
export type PassportFieldRow = {
  id: string;
  label: string;
  original: string | null;
  translated: string | null;
};

/** Canonical field definition for extraction + translation table */
export type CanonicalFieldDef = {
  id: string;
  label: string;
  /** Key in extraction.fields, or "document_type" / "country" for top-level */
  fieldsKey: keyof ExtractionFields | "document_type" | "country";
  translatedKey: keyof TranslatedPassportData;
};

/**
 * Centralized canonical field definitions. Order matches display.
 * Ready for DOCX export and back-side support.
 */
export const CANONICAL_FIELD_DEFINITIONS: CanonicalFieldDef[] = [
  { id: "document_type", label: "Document Type", fieldsKey: "document_type", translatedKey: "document_type_translated" },
  { id: "issuing_country", label: "Issuing Country", fieldsKey: "country", translatedKey: "issuing_country_translated" },
  { id: "surname", label: "Surname", fieldsKey: "surname", translatedKey: "surname_translated" },
  { id: "name", label: "Given Names", fieldsKey: "name", translatedKey: "given_names_translated" },
  { id: "fathers_name", label: "Father's Name", fieldsKey: "fathers_name", translatedKey: "fathers_name_translated" },
  { id: "document_number", label: "Document Number", fieldsKey: "document_number", translatedKey: "passport_number" },
  { id: "nationality", label: "Nationality", fieldsKey: "nationality", translatedKey: "nationality_translated" },
  { id: "date_of_birth", label: "Date of Birth", fieldsKey: "date_of_birth", translatedKey: "date_of_birth" },
  { id: "sex", label: "Sex", fieldsKey: "sex", translatedKey: "sex_translated" },
  { id: "place_of_birth", label: "Place of Birth", fieldsKey: "place_of_birth", translatedKey: "place_of_birth_translated" },
  { id: "place_of_issue", label: "Place of Issue", fieldsKey: "place_of_issue", translatedKey: "place_of_issue_translated" },
  { id: "date_of_issue", label: "Date of Issue", fieldsKey: "date_of_issue", translatedKey: "date_of_issue" },
  { id: "date_of_expiry", label: "Date of Expiry", fieldsKey: "date_of_expiry", translatedKey: "date_of_expiry" },
  { id: "issuing_authority", label: "Issuing Authority", fieldsKey: "issuing_authority", translatedKey: "issuing_authority_translated" },
];

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function getOriginalValue(
  extraction: ExtractionResult,
  def: CanonicalFieldDef
): string | null {
  if (def.fieldsKey === "document_type") return asString(extraction.document_type);
  if (def.fieldsKey === "country") return asString(extraction.country);
  const fields = extraction.fields ?? {};
  return asString(fields[def.fieldsKey as keyof ExtractionFields]);
}

function getTranslatedValue(
  def: CanonicalFieldDef,
  original: string | null,
  translated: TranslatedPassportData
): string | null {
  const tRaw = translated[def.translatedKey];
  const t = asString(tRaw);
  if (t !== null) return t;
  return original;
}

/**
 * Build table rows from canonical extraction and translated output.
 * Handles null/missing values gracefully; fathers_name omitted when both empty.
 */
export function buildExtractionTableRows(
  extraction: ExtractionResult,
  translated: TranslatedPassportData
): PassportFieldRow[] {
  return CANONICAL_FIELD_DEFINITIONS.map((def) => {
    const original = getOriginalValue(extraction, def);
    const translatedVal = getTranslatedValue(def, original, translated);
    return {
      id: def.id,
      label: def.label,
      original,
      translated: translatedVal,
    };
  }).filter((row) => row.original !== null || row.translated !== null);
}

/** Effective translated text shown in UI (user override or server value). */
export function getEffectiveTranslated(
  row: PassportFieldRow,
  override: string | undefined
): string {
  if (override !== undefined) return override;
  return row.translated ?? "";
}

/** Copy: effective translated if non-empty after trim, else original. */
export function getCopyValue(row: PassportFieldRow, override?: string): string {
  const t = getEffectiveTranslated(row, override).trim();
  if (t.length > 0) return getEffectiveTranslated(row, override);
  if (row.original !== null && row.original !== "") return row.original;
  return "";
}

/** Whether user has changed translated text from server baseline. */
export function isTranslatedEdited(
  row: PassportFieldRow,
  override: string | undefined
): boolean {
  if (override === undefined) return false;
  return override.trim() !== (row.translated ?? "").trim();
}
