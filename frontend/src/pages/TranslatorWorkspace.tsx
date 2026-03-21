import { useCallback, useEffect, useMemo, useState } from "react";
import { UploadCard } from "../components/UploadCard";
import { ImagePreviewCard } from "../components/ImagePreviewCard";
import { MrzReviewCard } from "../components/MrzReviewCard";
import { PassportDataTable } from "../components/PassportDataTable";
import { getApiBaseUrl, processDocument, uploadPassportImage } from "../lib/api";
import { buildPassportTableRows } from "../lib/fieldMapping";
import type { ProcessDocumentResponse } from "../types/api";

const LANGUAGES = [
  { value: "Russian", label: "Russian" },
  { value: "English", label: "English" },
  { value: "Kazakh", label: "Kazakh" },
] as const;

/** Shared max width: wide workspace, minimal side gutters */
const SHELL = "mx-auto w-full max-w-[min(1680px,calc(100vw-1rem))] px-3 sm:px-4";

function LoadingOverlay({ message }: { message: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/25 backdrop-blur-[1px]">
      <div className="flex flex-col items-center gap-3 rounded-xl bg-white px-8 py-6 shadow-lg">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-indigo-600"
          aria-hidden
        />
        <p className="text-sm font-medium text-slate-700">{message}</p>
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

  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const tableRows = useMemo(() => {
    if (!result?.passport_data || !result?.translated_passport_data) return [];
    return buildPassportTableRows(
      result.passport_data,
      result.translated_passport_data
    );
  }, [result]);

  const tableResetKey = result?.file_id ?? null;

  const handleFileSelect = useCallback((f: File) => {
    setFile(f);
    setError(null);
    setResult(null);
    setUploadedFileId(null);
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
    <div className="min-h-screen bg-slate-100/80">
      {loading ? <LoadingOverlay message="Uploading and processing document…" /> : null}

      <header className="border-b border-slate-200 bg-white">
        <div className={`${SHELL} py-4 sm:py-5`}>
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
                AiDocTranslation
              </h1>
              <p className="mt-0.5 text-sm text-slate-600 sm:text-[15px]">
                Upload a passport · verify MRZ · review fields · correct translations
              </p>
            </div>
            <p className="text-[11px] text-slate-400">
              {/* API{" "} */}
              {/* <code className="rounded border border-slate-200 bg-slate-50 px-1.5 py-0.5 font-mono"> */}
                {/* {getApiBaseUrl()} */}
              {/* </code> */}
            </p>
          </div>
        </div>
      </header>

      {/* Compact controls */}
      <div className="border-b border-slate-200 bg-white">
        <div className={`${SHELL} flex flex-col gap-3 py-2.5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-4`}>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <label className="flex items-center gap-2 text-xs font-medium text-slate-600">
              <span className="whitespace-nowrap">Language</span>
              <select
                value={targetLanguage}
                disabled={loading}
                onChange={(e) => setTargetLanguage(e.target.value)}
                className="min-w-[7.5rem] rounded-lg border border-slate-200 bg-white py-1.5 pl-2 pr-8 text-sm text-slate-900 shadow-sm focus:border-indigo-400 focus:outline-none focus:ring-1 focus:ring-indigo-400/30 disabled:opacity-50"
              >
                {LANGUAGES.map((lang) => (
                  <option key={lang.value} value={lang.value}>
                    {lang.label}
                  </option>
                ))}
              </select>
            </label>
            <button
              type="button"
              disabled={!file || loading}
              onClick={() => void handleProcess()}
              className="rounded-lg bg-indigo-600 px-4 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Process passport
            </button>
          </div>
          {!file ? (
            <span className="text-xs text-slate-400">Select an image to enable processing</span>
          ) : null}
        </div>
      </div>

      <main className={`${SHELL} py-4 sm:py-5`}>
        {error ? (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900"
          >
            <span className="font-semibold">Request failed.</span> {error}
          </div>
        ) : null}

        <div className="grid gap-4 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] xl:grid-cols-[minmax(0,22rem)_minmax(0,1fr)] xl:gap-6">
          <div className="flex min-w-0 flex-col gap-3 lg:max-w-md xl:max-w-none">
            <UploadCard onFileSelect={handleFileSelect} disabled={loading} />
            <ImagePreviewCard
              previewUrl={previewUrl}
              fileName={file?.name ?? null}
              fileSizeBytes={file?.size ?? null}
              fileId={uploadedFileId ?? result?.file_id ?? null}
            />
          </div>

          <div className="min-w-0">
            {!file && !result ? (
              <div className="mb-4 rounded-lg border border-dashed border-slate-300 bg-white/80 px-4 py-6 text-center text-sm text-slate-500">
                <p className="font-medium text-slate-700">Workspace empty</p>
                <p className="mt-1 text-slate-500">
                  Upload a scan, choose language, then <strong>Process passport</strong>.
                </p>
              </div>
            ) : null}

            <MrzReviewCard mrz={result?.mrz_fields} hasProcessed={Boolean(result)} />

            <PassportDataTable rows={tableRows} resetKey={tableResetKey} />
          </div>
        </div>
      </main>
    </div>
  );
}
