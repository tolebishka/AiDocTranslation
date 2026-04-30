import { useEffect, useMemo, useState } from "react";

import {
  buildDownloadUrl,
  generateDocument,
  listTemplates,
} from "../lib/api";
import { applyTableOverrides } from "../lib/fieldMapping";
import type {
  ExtractionResult,
  GenerateDocumentResponse,
  TemplateInfo,
  TranslatedPassportData,
} from "../types/api";

type Props = {
  extraction: ExtractionResult | null;
  translated: TranslatedPassportData | null;
  /** Edits keyed by canonical field id (from PassportDataTable). */
  overrides: Record<string, string>;
  /** Currently selected primary translation language (e.g. "Russian"). */
  primaryLanguage: string;
};

function pickTemplateLabel(tpl: TemplateInfo, locale: string): string {
  const map = tpl.name ?? {};
  return (
    map[locale] ??
    map.Russian ??
    map.English ??
    tpl.id
  );
}

function describeLanguages(tpl: TemplateInfo): string {
  return tpl.languages.map((l) => l.name).join(" + ");
}

export function TemplateGenerationCard({
  extraction,
  translated,
  overrides,
  primaryLanguage,
}: Props) {
  const [templates, setTemplates] = useState<TemplateInfo[]>([]);
  const [templatesError, setTemplatesError] = useState<string | null>(null);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [selectedId, setSelectedId] = useState<string>("");

  const [busy, setBusy] = useState(false);
  const [genError, setGenError] = useState<string | null>(null);
  const [generated, setGenerated] = useState<GenerateDocumentResponse | null>(null);

  const country = extraction?.country ?? null;

  useEffect(() => {
    let aborted = false;
    setLoadingTemplates(true);
    setTemplatesError(null);
    listTemplates(country)
      .then((items) => {
        if (aborted) return;
        setTemplates(items);
        setSelectedId((prev) => {
          if (prev && items.some((t) => t.id === prev)) return prev;
          return items[0]?.id ?? "";
        });
      })
      .catch((err: unknown) => {
        if (aborted) return;
        const msg = err instanceof Error ? err.message : "Не удалось получить шаблоны";
        setTemplatesError(msg);
      })
      .finally(() => {
        if (!aborted) setLoadingTemplates(false);
      });

    return () => {
      aborted = true;
    };
  }, [country]);

  useEffect(() => {
    setGenerated(null);
    setGenError(null);
  }, [selectedId, extraction, translated, overrides, primaryLanguage]);

  const overridesPayload = useMemo<TranslatedPassportData | null>(() => {
    if (!translated) return null;
    return applyTableOverrides(translated, overrides);
  }, [translated, overrides]);

  const canGenerate = Boolean(extraction && overridesPayload && selectedId && !busy);

  async function handleGenerate() {
    if (!extraction || !overridesPayload || !selectedId) return;
    setBusy(true);
    setGenError(null);
    setGenerated(null);
    try {
      const res = await generateDocument({
        template_id: selectedId,
        extraction,
        primary_language: primaryLanguage,
        primary_overrides: overridesPayload,
      });
      setGenerated(res);
    } catch (err) {
      setGenError(err instanceof Error ? err.message : "Не удалось сгенерировать документ");
    } finally {
      setBusy(false);
    }
  }

  if (!extraction || !translated) {
    return null;
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100/90 bg-gradient-to-r from-white to-teal-50/30 px-4 py-3 sm:px-5">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">
            Документ
          </h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Подставить данные в шаблон и скачать готовый файл
          </p>
        </div>
        <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
          DOCX
        </span>
      </div>

      <div className="space-y-4 px-4 py-4 sm:px-5">
        <div>
          <label className="block text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Шаблон
          </label>
          <div className="relative mt-1.5">
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              disabled={loadingTemplates || templates.length === 0 || busy}
              className="input-modern w-full cursor-pointer appearance-none disabled:cursor-not-allowed"
            >
              {templates.length === 0 ? (
                <option value="">
                  {loadingTemplates ? "Загрузка шаблонов…" : "Нет доступных шаблонов"}
                </option>
              ) : (
                templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {pickTemplateLabel(tpl, "Russian")} · {describeLanguages(tpl)}
                  </option>
                ))
              )}
            </select>
            <span
              className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
              aria-hidden
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          </div>
          {country ? (
            <p className="mt-1.5 text-[11px] text-slate-500">
              Отфильтровано по стране из MRZ: <span className="font-medium text-slate-700">{country}</span>
            </p>
          ) : null}
          {templatesError ? (
            <p className="mt-1.5 text-[11px] text-red-700">{templatesError}</p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-3">
          <p className="text-[11px] leading-relaxed text-slate-500">
            Перевод в шаблон возьмётся из таблицы выше (с учётом ваших правок).
            Дополнительные языки шаблона будут переведены автоматически.
          </p>
          <button
            type="button"
            disabled={!canGenerate}
            onClick={() => void handleGenerate()}
            className="btn-primary px-4"
          >
            {busy ? (
              <>
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                Генерация…
              </>
            ) : (
              <>
                <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                Сгенерировать
              </>
            )}
          </button>
        </div>

        {genError ? (
          <div className="rounded-xl border border-red-200/90 bg-red-50/90 px-3 py-2 text-xs text-red-900">
            <span className="font-semibold">Ошибка.</span> {genError}
          </div>
        ) : null}

        {generated ? (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-teal-200/80 bg-teal-50/70 px-3 py-2.5 text-xs animate-fade-in">
            <div className="min-w-0">
              <p className="font-semibold text-teal-900">Готово!</p>
              <p className="mt-0.5 truncate text-teal-800/80">{generated.filename}</p>
            </div>
            <a
              href={buildDownloadUrl(generated.download_url)}
              download={generated.filename}
              className="btn-secondary px-3"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5 5-5M12 15V3" />
              </svg>
              Скачать
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}
