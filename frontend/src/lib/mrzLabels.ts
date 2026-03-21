import type { MrzValidations } from "../types/api";

export const MRZ_VALIDATION_ITEMS: {
  key: keyof MrzValidations;
  label: string;
}[] = [
  { key: "passport_number_valid", label: "Passport number" },
  { key: "birth_date_valid", label: "Birth date" },
  { key: "expiry_date_valid", label: "Expiry date" },
  { key: "optional_data_valid", label: "Optional data" },
  { key: "final_check_valid", label: "Final check" },
];

export const MRZ_PARSED_FIELDS: { key: string; label: string }[] = [
  { key: "document_type", label: "Document type" },
  { key: "issuing_country", label: "Issuing country" },
  { key: "surname_latin", label: "Surname" },
  { key: "given_names_latin", label: "Given names" },
  { key: "passport_number", label: "Passport number" },
  { key: "nationality", label: "Nationality" },
  { key: "date_of_birth", label: "Date of birth" },
  { key: "sex", label: "Sex" },
  { key: "date_of_expiry", label: "Date of expiry" },
];
