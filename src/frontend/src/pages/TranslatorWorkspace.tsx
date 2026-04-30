import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UploadCard } from "../components/UploadCard";
import { ImagePreviewCard } from "../components/ImagePreviewCard";
import { MrzReviewCard } from "../components/MrzReviewCard";
import { PassportDataTable } from "../components/PassportDataTable";
import { TemplateGenerationCard } from "../components/TemplateGenerationCard";
import { processDocument, uploadPassportImage } from "../lib/api";
import { buildExtractionTableRows } from "../lib/fieldMapping";
import type { ProcessDocumentResponse } from "../types/api";

const LANGUAGES = [
  { value: "Russian", label: "Русский" },
  { value: "English", label: "English" },
  { value: "Kazakh", label: "Қазақша" },
] as const;

const SHELL = "mx-auto w-full max-w-[min(1680px,calc(100vw-1.25rem))] px-4 sm:px-6";

function StepDot({ current, done }: { current: boolean; done: boolean }) {
  return (
    <span
      className={[
        "flex h-2.5 w-2.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-white/90 transition",
        done
          ? "bg-teal-500 ring-teal-200/90"
          : current
            ? "bg-teal-400 ring-teal-100 shadow-sm shadow-teal-500/30"
            : "bg-slate-200 ring-slate-100",
      ].join(" ")}
      aria-hidden
    />
  );
}

function WorkspaceSteps({
  hasFile,
  hasResult,
  busy,
}: {
  hasFile: boolean;
  hasResult: boolean;
  busy: boolean;
}) {
  const items = [
    { id: "upload", label: "Загрузка", done: hasFile, current: !hasFile },
    {
      id: "process",
      label: "Обработка",
      done: hasResult,
      current: busy || (hasFile && !hasResult),
    },
    { id: "review", label: "Проверка", done: false, current: hasResult && !busy },
  ] as const;

  return (
    <nav className="flex flex-wrap items-center gap-4 sm:gap-6" aria-label="Этапы работы">
      {items.map((item, i) => (
        <div key={item.id} className="flex items-center gap-2">
          <StepDot current={item.current} done={item.done} />
          <span
            className={[
              "text-xs font-semibold tracking-wide",
              item.done ? "text-teal-700" : item.current ? "text-slate-800" : "text-slate-400",
            ].join(" ")}
          >
            {item.label}
          </span>
          {i < items.length - 1 ? (
            <span className="hidden h-px w-8 max-w-[2rem] bg-gradient-to-r from-slate-200 to-slate-100 sm:block" aria-hidden />
          ) : null}
        </div>
      ))}
    </nav>
  );
}

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-md"
      role="alertdialog"
      aria-busy="true"
      aria-label="Загрузка"
    >
      <div className="surface-card mx-4 flex max-w-sm flex-col items-center gap-4 px-8 py-8 animate-fade-in">
        <div className="relative h-12 w-12">
          <div className="absolute inset-0 rounded-full border-2 border-slate-200" />
          <div className="absolute inset-0 animate-spin rounded-full border-2 border-transparent border-t-teal-500 border-r-teal-400/60" />
        </div>
        <p className="text-center text-sm font-medium leading-relaxed text-slate-700">{message}</p>
      </div>
    </div>
  );
}

export function TranslatorWorkspace() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [targetLanguage, setTargetLanguage] = useState<string>(LANGUAGES[0].value);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadedFileId, setUploadedFileId] = useState<string | null>(null);
  const [result, setResult] = useState<ProcessDocumentResponse | null>(null);
  const [tableOverrides, setTableOverrides] = useState<Record<string, string>>({});
  const previewRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!file || !previewRef.current) return;
    const el = previewRef.current;
    const t = window.setTimeout(() => {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 60);
    return () => window.clearTimeout(t);
  }, [file]);

  const tableRows = useMemo(() => {
    const extraction = result?.extraction;
    const translated = result?.translated_passport_data;
    if (!extraction?.fields || !translated) return [];
    return buildExtractionTableRows(extraction, translated);
  }, [result]);

  const tableResetKey = result?.file_id ?? null;

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setResult(null);
    setUploadedFileId(null);
    setTableOverrides({});
  }, []);

  const handleProcess = async () => {
    if (!file) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setUploadedFileId(null);

    try {
      const uploadRes = await uploadPassportImage(file);
      setUploadedFileId(uploadRes.file_id);
      const processed = await processDocument(uploadRes.file_id, targetLanguage);
      setResult(processed);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-12">
      {loading ? <LoadingOverlay message="Загрузка и распознавание документа…" /> : null}

      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 shadow-sm backdrop-blur-xl">
        <div className={`${SHELL} bg-mesh-header py-5 sm:py-6`}>
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-teal-400 to-teal-600 shadow-lg shadow-teal-500/30 ring-1 ring-white/50">
                  <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                    AiDoc<span className="text-teal-600">Translation</span>
                  </h1>
                  <p className="mt-0.5 max-w-xl text-sm leading-relaxed text-slate-600 sm:text-[15px]">
                    Загрузите паспорт, проверьте MRZ и поля, при необходимости поправьте перевод.
                  </p>
                </div>
              </div>
            </div>
            <WorkspaceSteps hasFile={Boolean(file)} hasResult={Boolean(result)} busy={loading} />
          </div>
        </div>

        <div className={`${SHELL} border-t border-slate-100/80 bg-white/60 py-3 backdrop-blur-sm`}>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between sm:gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <label className="group flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Язык</span>
                <div className="relative">
                  <select
                    value={targetLanguage}
                    disabled={loading}
                    onChange={(e) => setTargetLanguage(e.target.value)}
                    className="input-modern min-w-[10rem] cursor-pointer appearance-none pr-8 disabled:cursor-not-allowed"
                  >
                    {LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400" aria-hidden>
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </span>
                </div>
              </label>
              <button
                type="button"
                disabled={!file || loading}
                onClick={() => void handleProcess()}
                className="btn-primary px-5 disabled:shadow-none"
              >
                <svg className="h-4 w-4 opacity-90" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                Обработать
              </button>
            </div>
            {!file ? (
              <p className="text-xs text-slate-500">Выберите изображение, чтобы включить обработку</p>
            ) : (
              <p className="text-xs font-medium text-teal-700/90">Файл готов · можно запускать</p>
            )}
          </div>
        </div>
      </header>

      <main className={`${SHELL} py-6 sm:py-8`}>
        {error ? (
          <div
            role="alert"
            className="mb-6 flex gap-3 rounded-2xl border border-red-200/90 bg-red-50/90 px-4 py-3 text-sm text-red-900 shadow-sm backdrop-blur-sm animate-fade-in"
          >
            <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 text-red-600" aria-hidden>
              !
            </span>
            <div>
              <span className="font-semibold">Ошибка запроса.</span> {error}
            </div>
          </div>
        ) : null}

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,24rem)_minmax(0,1fr)] xl:gap-8">
          <div className="flex min-w-0 flex-col gap-4 lg:sticky lg:top-[176px] lg:max-h-[calc(100vh-188px)] lg:max-w-md lg:overflow-y-auto lg:pr-1 xl:max-w-none">
            {file ? (
              <div ref={previewRef} className="animate-fade-in">
                <ImagePreviewCard
                  previewUrl={previewUrl}
                  fileName={file?.name ?? null}
                  fileSizeBytes={file?.size ?? null}
                  fileId={uploadedFileId ?? result?.file_id ?? null}
                />
              </div>
            ) : null}
            <UploadCard onFileSelect={handleFileSelect} disabled={loading} compact={Boolean(file)} />
            <aside
              className="surface-card-muted border-teal-100/50 px-4 py-3 text-xs text-slate-600"
              aria-label="Памятка"
            >
              <p className="font-semibold text-slate-800">Перед загрузкой</p>
              <ul className="mt-2 space-y-1.5 text-[11px] leading-relaxed text-slate-600">
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  Файлы обрабатываются временно и удаляются автоматически
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  Проверяйте извлечённые и переведённые данные перед использованием
                </li>
                <li className="flex gap-2">
                  <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-teal-500" aria-hidden />
                  Загружайте только те документы, которые вам разрешено использовать
                </li>
              </ul>
            </aside>
          </div>

          <div className="min-w-0 space-y-4">
            {!file && !result ? (
              <div className="surface-card border-dashed border-slate-300/90 bg-gradient-to-b from-white to-slate-50/80 px-6 py-10 text-center animate-fade-in">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
                  <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>
                <p className="text-base font-semibold text-slate-800">Рабочая область пуста</p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-slate-500">
                  Загрузите скан или фото, выберите язык и нажмите{" "}
                  <strong className="text-slate-700">Обработать</strong>.
                </p>
              </div>
            ) : null}

            <PassportDataTable
              rows={tableRows}
              resetKey={tableResetKey}
              onOverridesChange={setTableOverrides}
            />

            {result?.extraction && result?.translated_passport_data ? (
              <TemplateGenerationCard
                extraction={result.extraction}
                translated={result.translated_passport_data}
                overrides={tableOverrides}
                primaryLanguage={targetLanguage}
              />
            ) : null}

            <MrzReviewCard
              extraction={result?.extraction}
              mrzValidations={result?.mrz_fields?.validations}
              hasProcessed={Boolean(result)}
            />
          </div>
        </div>

        <footer className="mt-12 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-slate-200/80 pt-8 text-xs text-slate-500">
          <Link to="/privacy" className="font-medium text-slate-600 transition hover:text-teal-700">
            Конфиденциальность
          </Link>
          <span className="hidden text-slate-300 sm:inline" aria-hidden>
            ·
          </span>
          <Link to="/terms" className="font-medium text-slate-600 transition hover:text-teal-700">
            Условия использования
          </Link>
        </footer>
      </main>
    </div>
  );
}
