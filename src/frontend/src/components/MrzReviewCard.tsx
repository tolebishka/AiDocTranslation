import type { ExtractionResult, MrzValidations } from "../types/api";
import { CANONICAL_FIELD_DEFINITIONS } from "../lib/fieldMapping";
import { MRZ_VALIDATION_ITEMS } from "../lib/mrzLabels";

type MrzReviewCardProps = {
  /** Canonical extraction; MRZ lines and parsed fields come from here */
  extraction: ExtractionResult | null | undefined;
  /** Check-digit validations (from raw MRZ parse, not in canonical) */
  mrzValidations?: MrzValidations | null;
  hasProcessed: boolean;
};

function displayValue(v: unknown): string {
  if (v === null || v === undefined) return "—";
  const s = String(v).trim();
  return s.length === 0 ? "—" : s;
}

function ValidationBadge({ ok }: { ok: boolean }) {
  if (ok) {
    return (
      <span className="inline-flex items-center gap-0.5 rounded-md bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-emerald-800 ring-1 ring-emerald-200/80">
        <span className="text-emerald-600" aria-hidden>
          ✓
        </span>
        Pass
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-0.5 rounded-md bg-red-50 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-red-800 ring-1 ring-red-200/80">
      <span className="text-red-600" aria-hidden>
        ✗
      </span>
      Fail
    </span>
  );
}

function ValidationRow({ label, value }: { label: string; value: boolean | undefined }) {
  const known = value !== undefined;
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-1 last:border-0">
      <span className="text-[11px] text-slate-600">{label}</span>
      {known ? (
        <ValidationBadge ok={value} />
      ) : (
        <span className="text-[10px] text-slate-400">—</span>
      )}
    </div>
  );
}

/** Map canonical field id to extraction value (fields or top-level) */
function getExtractionFieldValue(extraction: ExtractionResult, fieldId: string): unknown {
  if (fieldId === "document_type") return extraction.document_type;
  if (fieldId === "country") return extraction.country;
  const fields = extraction.fields ?? {};
  return fields[fieldId as keyof typeof fields];
}

/** Fields to show in MRZ parsed section (subset of canonical) */
const MRZ_DISPLAY_FIELD_IDS = [
  "document_type",
  "country",
  "surname",
  "name",
  "document_number",
  "nationality",
  "date_of_birth",
  "sex",
  "date_of_expiry",
] as const;

export function MrzReviewCard({ extraction, mrzValidations, hasProcessed }: MrzReviewCardProps) {
  if (!hasProcessed) {
    return null;
  }

  const mrz = extraction?.mrz;
  const hasMrzLines = mrz && (mrz.line1 || mrz.line2);
  const line1 = displayValue(mrz?.line1);
  const line2 = displayValue(mrz?.line2);

  if (!extraction || (!hasMrzLines && !extraction.fields)) {
    return (
      <div className="surface-card-muted mb-4 border-dashed border-amber-200/80 px-4 py-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-amber-800/90">
          MRZ
        </h2>
        <p className="mt-2 text-center text-sm font-semibold text-slate-700">MRZ не обнаружен</p>
        <p className="mt-1.5 text-center text-xs leading-relaxed text-slate-500">
          Машиночитаемая зона не найдена или не распознана. Основные поля могут быть только из OCR.
        </p>
      </div>
    );
  }

  const mrzType = hasMrzLines ? "TD3" : null;

  return (
    <div className="surface-card mb-4 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-3">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">
            Проверка MRZ
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">
            Строки MRZ · поля · контрольные цифры ICAO
          </p>
        </div>
        {mrzType ? (
          <span className="rounded-lg bg-slate-900 px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-wider text-teal-300">
            {mrzType}
          </span>
        ) : null}
      </div>

      {hasMrzLines ? (
        <div className="mt-4 space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Строки MRZ
          </p>
          <div className="max-w-full overflow-x-auto rounded-xl border border-slate-800 bg-slate-900 px-3 py-2.5 font-mono text-[11px] leading-relaxed text-teal-50/95 shadow-inner break-all ring-1 ring-black/20">
            <div className="whitespace-pre-wrap break-all">{line1}</div>
            <div className="mt-2 whitespace-pre-wrap break-all border-t border-slate-700/80 pt-2 text-slate-200">
              {line2}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Распознанные поля
          </p>
          <dl className="mt-2 space-y-0.5">
            {MRZ_DISPLAY_FIELD_IDS.map((fieldId) => {
              const def = CANONICAL_FIELD_DEFINITIONS.find((d) => d.id === fieldId);
              const value = getExtractionFieldValue(extraction, fieldId);
              return (
                <div
                  key={fieldId}
                  className="flex gap-2 border-b border-slate-50 py-0.5 text-[11px] last:border-0"
                >
                  <dt className="w-[40%] shrink-0 text-slate-500">
                    {def?.label ?? fieldId}
                  </dt>
                  <dd className="min-w-0 break-words font-medium text-slate-800">
                    {displayValue(value)}
                  </dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
            Контрольные суммы
          </p>
          <div className="mt-2 rounded-xl border border-slate-200/80 bg-slate-50/90 px-2.5 py-1.5 ring-1 ring-slate-100/80">
            {MRZ_VALIDATION_ITEMS.map(({ key, label }) => (
              <ValidationRow
                key={key}
                label={label}
                value={mrzValidations?.[key as keyof MrzValidations]}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
