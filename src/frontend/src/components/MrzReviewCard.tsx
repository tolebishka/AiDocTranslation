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
      <div className="mb-4 rounded-xl border border-dashed border-slate-300 bg-slate-50/80 px-4 py-4 shadow-sm">
        <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          MRZ review
        </h2>
        <p className="mt-2 text-center text-sm font-medium text-slate-600">MRZ not detected</p>
        <p className="mt-1 text-center text-[12px] text-slate-500">
          No machine-readable zone was found or parsed. Main fields may come from OCR only.
        </p>
      </div>
    );
  }

  const mrzType = hasMrzLines ? "TD3" : null;

  return (
    <div className="mb-4 rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-slate-100 pb-2">
        <div>
          <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            MRZ review
          </h2>
          <p className="text-[12px] text-slate-500">
            Raw lines · parsed fields · ICAO check digits
          </p>
        </div>
        {mrzType ? (
          <span className="rounded-md bg-slate-100 px-2 py-0.5 font-mono text-[10px] font-semibold text-slate-600">
            {mrzType}
          </span>
        ) : null}
      </div>

      {hasMrzLines ? (
        <div className="mt-3 space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            MRZ lines
          </p>
          <div className="max-w-full overflow-x-auto rounded-lg border border-slate-200 bg-slate-900/[0.03] px-2 py-1.5 font-mono text-[11px] leading-relaxed text-slate-800 break-all">
            <div className="whitespace-pre-wrap break-all">{line1}</div>
            <div className="mt-1 whitespace-pre-wrap break-all border-t border-slate-200/80 pt-1">
              {line2}
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Parsed fields
          </p>
          <dl className="mt-1.5 space-y-0.5">
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
          <p className="text-[10px] font-semibold uppercase tracking-wide text-slate-400">
            Check digit validation
          </p>
          <div className="mt-1.5 rounded-lg border border-slate-100 bg-slate-50/50 px-2 py-1">
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
