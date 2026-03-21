import { useCallback, useRef, useState } from "react";

type UploadCardProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
};

export function UploadCard({
  onFileSelect,
  disabled = false,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/heic,.heic",
}: UploadCardProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleFiles = useCallback(
    (files: FileList | null) => {
      if (!files?.length || disabled) return;
      const file = files[0];
      if (!file.type.startsWith("image/") && !file.name.toLowerCase().endsWith(".heic")) {
        return;
      }
      onFileSelect(file);
    },
    [disabled, onFileSelect]
  );

  return (
    <div className="rounded-xl border border-slate-200/90 bg-white p-4 shadow-sm">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
        Upload
      </h2>
      <p className="text-[13px] text-slate-600">Passport image · JPEG, PNG, WebP</p>

      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            inputRef.current?.click();
          }
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!disabled) setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        onDrop={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsDragging(false);
          if (disabled) return;
          handleFiles(e.dataTransfer.files);
        }}
        className={[
          "mt-3 flex min-h-[104px] cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed transition-colors",
          disabled ? "cursor-not-allowed opacity-50" : "",
          isDragging
            ? "border-indigo-400 bg-indigo-50/50"
            : "border-slate-200 bg-slate-50/40 hover:border-slate-300",
        ].join(" ")}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <svg
          className="h-8 w-8 text-slate-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-1.5 text-xs font-medium text-slate-600">Drop or click</p>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        disabled={disabled}
        onChange={(e) => handleFiles(e.target.files)}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        className="mt-2 w-full rounded-lg border border-slate-200 bg-slate-900 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Choose file
      </button>
    </div>
  );
}
