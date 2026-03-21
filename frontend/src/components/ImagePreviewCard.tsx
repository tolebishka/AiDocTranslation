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
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Preview
      </h2>
      <p className="text-[12px] text-slate-500">Current upload</p>

      <div className="mt-2 overflow-hidden rounded-lg border border-slate-100 bg-slate-50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Passport preview"
            className="max-h-[min(220px,32vh)] w-full object-contain object-top"
          />
        ) : (
          <div className="flex min-h-[120px] items-center justify-center text-xs text-slate-400">
            No image
          </div>
        )}
      </div>

      <dl className="mt-2 space-y-1 border-t border-slate-100 pt-2 text-[11px] text-slate-500">
        <div className="flex justify-between gap-2">
          <dt className="shrink-0 text-slate-400">File</dt>
          <dd className="truncate text-right text-slate-600" title={fileName ?? ""}>
            {fileName ?? "—"}
          </dd>
        </div>
        <div className="flex justify-between gap-2">
          <dt className="text-slate-400">Size</dt>
          <dd className="text-slate-600">{formatBytes(fileSizeBytes ?? null)}</dd>
        </div>
        {fileId ? (
          <div className="flex justify-between gap-2">
            <dt className="shrink-0 text-slate-400">ID</dt>
            <dd
              className="truncate text-right font-mono text-[10px] text-slate-500"
              title={fileId}
            >
              {fileId}
            </dd>
          </div>
        ) : null}
      </dl>
    </div>
  );
}
