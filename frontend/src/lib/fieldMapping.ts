import type { PassportData, TranslatedPassportData } from "../types/api";

/** One logical row in the comparison table */
export type PassportFieldRow = {
  id: string;
  label: string;
  original: string | null;
  translated: string | null;
};

export type FieldDefinition = {
  id: string;
  label: string;
  originalKey: keyof PassportData;
  /** Key on translated object; shared keys (dates, passport #) use same name */
  translatedKey: keyof TranslatedPassportData;
};

/**
 * Order and labels match product requirements.
 */
export const FIELD_DEFINITIONS: FieldDefinition[] = [
  {
    id: "document_type",
    label: "Document Type",
    originalKey: "document_type",
    translatedKey: "document_type_translated",
  },
  {
    id: "issuing_country",
    label: "Issuing Country",
    originalKey: "issuing_country",
    translatedKey: "issuing_country_translated",
  },
  {
    id: "surname",
    label: "Surname",
    originalKey: "surname_latin",
    translatedKey: "surname_translated",
  },
  {
    id: "given_names",
    label: "Given Names",
    originalKey: "given_names_latin",
    translatedKey: "given_names_translated",
  },
  {
    id: "passport_number",
    label: "Passport Number",
    originalKey: "passport_number",
    translatedKey: "passport_number",
  },
  {
    id: "nationality",
    label: "Nationality",
    originalKey: "nationality",
    translatedKey: "nationality_translated",
  },
  {
    id: "date_of_birth",
    label: "Date of Birth",
    originalKey: "date_of_birth",
    translatedKey: "date_of_birth",
  },
  {
    id: "sex",
    label: "Sex",
    originalKey: "sex",
    translatedKey: "sex_translated",
  },
  {
    id: "place_of_birth",
    label: "Place of Birth",
    originalKey: "place_of_birth",
    translatedKey: "place_of_birth_translated",
  },
  {
    id: "place_of_issue",
    label: "Place of Issue",
    originalKey: "place_of_issue",
    translatedKey: "place_of_issue_translated",
  },
  {
    id: "date_of_issue",
    label: "Date of Issue",
    originalKey: "date_of_issue",
    translatedKey: "date_of_issue",
  },
  {
    id: "date_of_expiry",
    label: "Date of Expiry",
    originalKey: "date_of_expiry",
    translatedKey: "date_of_expiry",
  },
  {
    id: "issuing_authority",
    label: "Issuing Authority",
    originalKey: "issuing_authority",
    translatedKey: "issuing_authority_translated",
  },
];

function asString(v: unknown): string | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  return s.length === 0 ? null : s;
}

function baselineTranslatedString(row: PassportFieldRow): string {
  return row.translated ?? "";
}

/**
 * Translated column: use translated field when set; for shared keys fall back to original.
 */
export function getTranslatedDisplay(
  def: FieldDefinition,
  original: PassportData,
  translated: TranslatedPassportData
): string | null {
  const tRaw = translated[def.translatedKey as string];
  const t = asString(tRaw);
  if (t !== null) return t;
  const o = asString(original[def.originalKey as string]);
  return o;
}

export function buildPassportTableRows(
  original: PassportData,
  translated: TranslatedPassportData
): PassportFieldRow[] {
  return FIELD_DEFINITIONS.map((def) => {
    const orig = asString(original[def.originalKey as string]);
    const trans = getTranslatedDisplay(def, original, translated);
    return {
      id: def.id,
      label: def.label,
      original: orig,
      translated: trans,
    };
  }).filter((row) => row.original !== null || row.translated !== null);
}

/** Effective translated text shown in UI (user override or server value). */
export function getEffectiveTranslated(
  row: PassportFieldRow,
  override: string | undefined
): string {
  if (override !== undefined) return override;
  return baselineTranslatedString(row);
}

/** Copy: effective translated if non-empty after trim, else original. */
export function getCopyValue(row: PassportFieldRow, override?: string): string {
  const t = getEffectiveTranslated(row, override).trim();
  if (t.length > 0) return getEffectiveTranslated(row, override);
  if (row.original !== null && row.original !== "") return row.original;
  return "";
}

/** Whether user has changed translated text from server baseline. */
export function isTranslatedEdited(row: PassportFieldRow, override: string | undefined): boolean {
  if (override === undefined) return false;
  return override.trim() !== baselineTranslatedString(row).trim();
}
