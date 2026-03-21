/** Passport fields from OCR / MRZ pipeline */
export type PassportData = {
  document_type?: string | null;
  issuing_country?: string | null;
  surname_latin?: string | null;
  given_names_latin?: string | null;
  passport_number?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
  place_of_birth?: string | null;
  place_of_issue?: string | null;
  date_of_issue?: string | null;
  date_of_expiry?: string | null;
  issuing_authority?: string | null;
  [key: string]: unknown;
};

/** Structured translation output from OpenAI */
export type TranslatedPassportData = {
  document_type_translated?: string | null;
  issuing_country_translated?: string | null;
  surname_translated?: string | null;
  given_names_translated?: string | null;
  passport_number?: string | null;
  nationality_translated?: string | null;
  date_of_birth?: string | null;
  sex_translated?: string | null;
  place_of_birth_translated?: string | null;
  place_of_issue_translated?: string | null;
  date_of_issue?: string | null;
  date_of_expiry?: string | null;
  issuing_authority_translated?: string | null;
  [key: string]: unknown;
};

export type UploadResponse = {
  status?: string;
  file_id: string;
  filename?: string;
  message?: string;
  [key: string]: unknown;
};

/** TD3 MRZ parse + check-digit validation from backend */
export type MrzValidations = {
  passport_number_valid?: boolean;
  birth_date_valid?: boolean;
  expiry_date_valid?: boolean;
  optional_data_valid?: boolean;
  final_check_valid?: boolean;
};

export type MrzFields = {
  mrz_type?: string;
  document_type?: string | null;
  issuing_country?: string | null;
  surname_latin?: string | null;
  given_names_latin?: string | null;
  passport_number?: string | null;
  nationality?: string | null;
  date_of_birth?: string | null;
  sex?: string | null;
  date_of_expiry?: string | null;
  optional_data?: string | null;
  mrz_line_1?: string | null;
  mrz_line_2?: string | null;
  validations?: MrzValidations;
  [key: string]: unknown;
};

export type ProcessDocumentResponse = {
  status: string;
  service?: string;
  message?: string;
  file_id: string;
  passport_data: PassportData;
  translated_passport_data: TranslatedPassportData;
  mrz_fields?: MrzFields | null;
  ocr_text?: string;
};

export type ApiErrorBody = {
  detail?: string | { msg?: string }[] | string;
};
