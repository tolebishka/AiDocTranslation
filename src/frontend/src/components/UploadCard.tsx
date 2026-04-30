import { useCallback, useRef, useState } from "react";

type UploadCardProps = {
  onFileSelect: (file: File) => void;
  disabled?: boolean;
  accept?: string;
  /** Compact look once a file is already selected */
  compact?: boolean;
};

export function UploadCard({
  onFileSelect,
  disabled = false,
  accept = "image/jpeg,image/png,image/webp,image/gif,image/heic,.heic",
  compact = false,
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
    <div className={["surface-card", compact ? "p-4" : "p-5"].join(" ")}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">
            {compact ? "Сменить файл" : "Загрузка"}
          </h2>
          <p className={["text-slate-600", compact ? "mt-0.5 text-xs" : "mt-1 text-sm"].join(" ")}>
            Изображение паспорта · JPEG, PNG, WebP
          </p>
        </div>
        {!compact ? (
          <span className="rounded-lg bg-slate-100 px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-slate-500">
            MRZ + OCR
          </span>
        ) : null}
      </div>

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
          "group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all duration-200",
          compact ? "mt-3 min-h-[64px] py-2" : "mt-4 min-h-[120px]",
          disabled ? "cursor-not-allowed opacity-50" : "",
          isDragging
            ? "border-teal-400 bg-teal-50/80 shadow-md shadow-teal-500/10"
            : "border-slate-200/90 bg-slate-50/50 hover:border-teal-300/80 hover:bg-teal-50/30",
        ].join(" ")}
        onClick={() => !disabled && inputRef.current?.click()}
      >
        <div
          className={[
            "flex items-center justify-center rounded-2xl transition-colors",
            compact ? "h-9 w-9" : "mb-2 h-12 w-12",
            isDragging ? "bg-teal-500 text-white" : "bg-white text-teal-600 shadow-sm ring-1 ring-slate-200/80 group-hover:ring-teal-200",
          ].join(" ")}
        >
          <svg className={compact ? "h-4 w-4" : "h-6 w-6"} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.75}
              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
            />
          </svg>
        </div>
        {!compact ? (
          <>
            <p className="text-sm font-semibold text-slate-700">Перетащите файл сюда</p>
            <p className="mt-0.5 text-xs text-slate-500">или нажмите для выбора</p>
          </>
        ) : (
          <p className="mt-1 text-[11px] font-medium text-slate-500">Перетащите или нажмите</p>
        )}
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
        className={["btn-secondary mt-3 w-full", compact ? "py-2 text-xs" : "py-2.5 text-sm"].join(" ")}
      >
        {compact ? "Сменить файл" : "Выбрать файл"}
      </button>
    </div>
  );
}
