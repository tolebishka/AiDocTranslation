# China passport — replacements cheat sheet

Use this as a step-by-step guide when converting the filled
`Паспорт Китай МИД Пекин ...docx` into a docxtpl template.

## Workflow in Microsoft Word / LibreOffice Writer

For **every** value in the table below:

1. Double-click the value in the document to select the word, or drag-select
   the whole phrase (e.g. "10 ОКТЯБРЯ 1975").
2. Press **Delete** so the cell is empty.
3. **Type** the placeholder by hand. Don't paste — pasting can re-split the
   text into multiple runs and break the placeholder.

Save the result as `template.docx` next to `manifest.json`.

## Russian half (top of document)

| Where in the file | Replace                  | With                              |
| ----------------- | ------------------------ | --------------------------------- |
| Surname/name line | `ГО` (the surname)       | `{{ ru.surname }}`                |
| Surname/name line | `ЮНЬ` (the given name)   | `{{ ru.given_names }}`            |
| Гражданство       | `КИТАЙ`                  | `{{ ru.nationality }}`            |
| Пол               | `М`                      | `{{ ru.sex }}`                    |
| Место рождения    | `ЦЗЯНСИ`                 | `{{ ru.place_of_birth }}`         |
| Дата рождения     | `10 ОКТЯБРЯ 1975`        | `{{ ru.date_of_birth_long }}`     |
| Дата выдачи       | `22 АПРЕЛЯ 2024`         | `{{ ru.date_of_issue_long }}`     |
| Дата истечения    | `22 АПРЕЛЯ 2029`         | `{{ ru.date_of_expiry_long }}`    |
| Орган выдачи      | `МИД, ПЕКИН`             | `{{ ru.issuing_authority }}`      |
| Тип               | `P`                      | `{{ ru.document_type }}`          |
| Код страны        | `CHN`                    | `{{ ru.issuing_country }}`        |
| Номер паспорта    | `PE 3133505`             | `{{ ru.passport_number }}`        |

## Kazakh half (bottom of document)

| Where in the file | Replace                       | With                              |
| ----------------- | ----------------------------- | --------------------------------- |
| Тегі/Аты          | `ГО` (the surname)            | `{{ kk.surname }}`                |
| Тегі/Аты          | `ЮНЬ`                         | `{{ kk.given_names }}`            |
| Азаматтығы        | `ҚЫТАЙ`                       | `{{ kk.nationality }}`            |
| Жынысы            | `Е`                           | `{{ kk.sex }}`                    |
| Туылған жері      | `ЦЗЯНСИ`                      | `{{ kk.place_of_birth }}`         |
| Туылған кезі      | `10 ҚАЗАН 1975`               | `{{ kk.date_of_birth_long }}`     |
| Берілген кезі     | `22 СӘУІР 2024`               | `{{ kk.date_of_issue_long }}`     |
| Жарамдылық мерз.  | `22 СӘУІР 2029`               | `{{ kk.date_of_expiry_long }}`    |
| Берген мекеме     | `СІМ, БЕЙЖІҢ`                 | `{{ kk.issuing_authority }}`      |
| Типі              | `P`                           | `{{ kk.document_type }}`          |
| Елдің коды        | `CHN`                         | `{{ kk.issuing_country }}`        |
| Төлқұжат нөмірі   | `PE 3133505`                  | `{{ kk.passport_number }}`        |

## MRZ block (the two long lines at the bottom of each page)

MRZ is identical for the Russian and Kazakh halves — it's always Latin and
comes straight from the passport. Replace the literal MRZ in the document:

| Replace                                            | With                |
| -------------------------------------------------- | ------------------- |
| `PPCHN GUO<<YUN<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<<` (first line)  | `{{ mrz.line1 }}` |
| `EE3133505<6CHN7510104M2904221<<<<<<<<<<<<<<06` (second line) | `{{ mrz.line2 }}` |

Tip: keep each placeholder on its own paragraph (the same way the original
MRZ lives in two separate paragraphs). The original monospace font is fine.

## Things you can leave as-is

- The static labels ("СВЕДЕНИЯ", "Фамилия/Имя", etc.) — they are not
  data, just headings.
- The "Фото владельца" placeholder text inside the photo cell.

## Verifying

After editing, search the file for the literal `{{` to make sure every
placeholder is on a single line and not split. The renderer will refuse the
template otherwise.
