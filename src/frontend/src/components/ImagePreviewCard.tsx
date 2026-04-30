type ImagePreviewCardProps = {
  previewUrl: string | null;
  fileName: string | null;
  fileSizeBytes?: number | null;
  fileId?: string | null;
};

function formatBytes(n: number | null | undefined): string {
  if (n == null || Number.isNaN(n)) return "—";
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ImagePreviewCard({
  previewUrl,
  fileName,
  fileSizeBytes,
  fileId,
}: ImagePreviewCardProps) {
  return (
    <div className="surface-card overflow-hidden p-5">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">
            Предпросмотр
          </h2>
          <p className="mt-0.5 text-xs text-slate-500">Текущий файл</p>
        </div>
      </div>

      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200/80 bg-gradient-to-b from-slate-50 to-slate-100/80 shadow-inner">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Предпросмотр паспорта"
            className="max-h-[min(240px,36vh)] w-full object-contain object-top"
          />
        ) : (
          <div className="flex min-h-[132px] flex-col items-center justify-center gap-2 px-4 py-8 text-center">
            <div className="rounded-xl bg-white/80 p-2 text-slate-300 shadow-sm ring-1 ring-slate-200/60">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.25}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <p className="text-xs font-medium text-slate-400">Нет изображения</p>
          </div>
        )}
      </div>

      <dl className="mt-4 space-y-2 rounded-xl bg-slate-50/90 px-3 py-3 text-[11px] text-slate-600 ring-1 ring-slate-100/80">
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-slate-400">Файл</dt>
          <dd className="truncate text-right font-medium text-slate-800" title={fileName ?? ""}>
            {fileName ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">Размер</dt>
          <dd className="font-medium text-slate-700">{formatBytes(fileSizeBytes ?? null)}</dd>
        </div>
        {fileId ? (
          <div className="flex justify-between gap-2 border-t border-slate-200/80 pt-2">
            <dt className="shrink-0 text-slate-400">ID</dt>
            <dd className="truncate text-right font-mono text-[10px] text-slate-500" title={fileId}>
              {fileId}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
