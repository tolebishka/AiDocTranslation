import { useEffect, useState } from "react";
import type { PassportFieldRow } from "../lib/fieldMapping";
import {
  getCopyValue,
  getEffectiveTranslated,
  isTranslatedEdited,
} from "../lib/fieldMapping";

type PassportDataTableProps = {
  /** Server-derived rows */
  rows: PassportFieldRow[];
  /** When this changes (e.g. new file_id), local overrides reset */
  resetKey: string | null;
  /** Optional notifier for parent so it can use the edited values
   *  (e.g. to render a translated document). Keyed by row id. */
  onOverridesChange?: (overrides: Record<string, string>) => void;
};

async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

function shouldUseTextarea(value: string): boolean {
  return value.length > 72 || value.includes("\n");
}

type RowActionsProps = {
  row: PassportFieldRow;
  override: string | undefined;
  editing: boolean;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  copyFlash: boolean;
  onCopy: () => void;
};

function RowActionButtons({
  row,
  override,
  editing,
  onEdit,
  onSave,
  onCancel,
  copyFlash,
  onCopy,
}: RowActionsProps) {
  const canCopy = getCopyValue(row, override).length > 0;

  if (editing) {
    return (
      <div className="flex flex-wrap items-center gap-1">
        <button
          type="button"
          onClick={onSave}
          className="rounded-lg bg-teal-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-sm ring-1 ring-teal-500/30 transition hover:bg-teal-500"
        >
          Сохранить
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-600 transition hover:bg-slate-50"
        >
          Отмена
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center gap-1">
      <button
        type="button"
        onClick={onEdit}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:border-teal-200 hover:bg-teal-50/50"
      >
        Правка
      </button>
      <button
        type="button"
        disabled={!canCopy}
        onClick={onCopy}
        className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {copyFlash ? "Скопировано" : "Копировать"}
      </button>
    </div>
  );
}

export function PassportDataTable({
  rows,
  resetKey,
  onOverridesChange,
}: PassportDataTableProps) {
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [flashId, setFlashId] = useState<string | null>(null);

  useEffect(() => {
    setOverrides({});
    setEditingId(null);
    setDraft("");
  }, [resetKey]);

  useEffect(() => {
    onOverridesChange?.(overrides);
  }, [overrides, onOverridesChange]);

  const startEdit = (row: PassportFieldRow) => {
    setEditingId(row.id);
    setDraft(getEffectiveTranslated(row, overrides[row.id]));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const saveEdit = (row: PassportFieldRow) => {
    const baseline = row.translated ?? "";
    const next = draft;
    setOverrides((prev) => {
      const copy = { ...prev };
      if (next.trim() === baseline.trim()) {
        delete copy[row.id];
      } else {
        copy[row.id] = next;
      }
      return copy;
    });
    setEditingId(null);
    setDraft("");
  };

  const handleCopyRow = async (row: PassportFieldRow) => {
    const text = getCopyValue(row, overrides[row.id]);
    if (!text) return;
    const ok = await copyText(text);
    if (ok) {
      setFlashId(row.id);
      setTimeout(() => setFlashId(null), 1500);
    }
  };

  if (rows.length === 0) {
    return (
      <div className="surface-card-muted border-dashed border-slate-300/80 px-4 py-10 text-center text-sm text-slate-500">
        Данных полей пока нет. Обработайте документ, чтобы проверить и править перевод.
      </div>
    );
  }

  return (
    <div className="surface-card overflow-hidden">
      <div className="border-b border-slate-100/90 bg-gradient-to-r from-white to-teal-50/30 px-4 py-3 sm:px-5">
        <h2 className="text-[11px] font-bold uppercase tracking-[0.14em] text-teal-700/90">
          Переводы
        </h2>
        <p className="mt-0.5 text-sm text-slate-600">
          Оригинал (OCR) · отредактируйте колонку перевода при необходимости
        </p>
      </div>

      {/* Desktop table */}
      <div className="hidden md:block">
        <table className="w-full table-fixed border-collapse text-left text-[13px] leading-snug">
          <colgroup>
            <col className="w-[11%]" />
            <col className="w-[26%]" />
            <col className="w-[49%]" />
            <col className="w-[14%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Поле
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-slate-500">
                Оригинал
              </th>
              <th className="border-l border-teal-100/80 bg-teal-50/50 px-3 py-2.5 text-left text-xs font-bold uppercase tracking-wider text-teal-900">
                Перевод
              </th>
              <th className="px-2 py-2.5 text-center text-xs font-bold uppercase tracking-wider text-slate-500">
                Действия
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const override = overrides[row.id];
              const edited = isTranslatedEdited(row, override);
              const isEditing = editingId === row.id;
              const display = getEffectiveTranslated(row, override);
              const useTa = isEditing && shouldUseTextarea(draft);

              return (
                <tr
                  key={row.id}
                  className={[
                    "border-b border-slate-100 align-top last:border-0",
                    edited ? "bg-amber-50/35" : "hover:bg-slate-50/50",
                  ].join(" ")}
                >
                  <td className="px-3 py-1.5">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className="font-medium text-slate-800">{row.label}</span>
                      {edited ? (
                        <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-900 ring-1 ring-amber-200/80">
                          Изменено
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-1.5 break-words text-slate-600 whitespace-pre-wrap">
                    {row.original ?? "—"}
                  </td>
                  <td className="border-l border-teal-100/70 bg-teal-50/25 px-3 py-1.5">
                    {isEditing ? (
                      useTa ? (
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={Math.min(6, Math.max(2, draft.split("\n").length))}
                          className="w-full resize-y rounded-lg border border-teal-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          autoFocus
                        />
                      ) : (
                        <input
                          type="text"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full rounded-lg border border-teal-200 bg-white px-2 py-1.5 text-[13px] text-slate-900 shadow-sm focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                          autoFocus
                        />
                      )
                    ) : (
                      <span className="block min-h-[1.25rem] break-words font-medium text-slate-900 whitespace-pre-wrap">
                        {display !== "" ? display : "—"}
                      </span>
                    )}
                  </td>
                  <td className="px-2 py-1.5 text-center">
                    <RowActionButtons
                      row={row}
                      override={override}
                      editing={isEditing}
                      onEdit={() => startEdit(row)}
                      onSave={() => saveEdit(row)}
                      onCancel={cancelEdit}
                      copyFlash={flashId === row.id}
                      onCopy={() => void handleCopyRow(row)}
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="space-y-2 p-3 md:hidden">
        {rows.map((row) => {
          const override = overrides[row.id];
          const edited = isTranslatedEdited(row, override);
          const isEditing = editingId === row.id;
          const display = getEffectiveTranslated(row, override);
          const useTa = isEditing && shouldUseTextarea(draft);

          return (
            <div
              key={row.id}
              className={[
                "rounded-lg border border-slate-200 px-3 py-2 shadow-sm",
                edited ? "border-amber-200/80 bg-amber-50/40" : "bg-white",
              ].join(" ")}
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-1.5">
                <span className="text-sm font-semibold text-slate-800">{row.label}</span>
                {edited ? (
                  <span className="rounded-md bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-amber-900 ring-1 ring-amber-200/80">
                    Изменено
                  </span>
                ) : null}
              </div>
              <div className="mt-2 space-y-2 text-[13px]">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Оригинал
                  </div>
                  <div className="mt-0.5 break-words text-slate-600 whitespace-pre-wrap">
                    {row.original ?? "—"}
                  </div>
                </div>
                <div className="rounded-xl bg-teal-50/50 px-2.5 py-2 ring-1 ring-teal-100/60">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-teal-900">
                    Перевод
                  </div>
                  <div className="mt-1">
                    {isEditing ? (
                      useTa ? (
                        <textarea
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          rows={4}
                          className="w-full resize-y rounded-lg border border-teal-200 bg-white px-2 py-1.5 text-[13px] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      ) : (
                        <input
                          type="text"
                          value={draft}
                          onChange={(e) => setDraft(e.target.value)}
                          className="w-full rounded-lg border border-teal-200 bg-white px-2 py-1.5 text-[13px] focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20"
                        />
                      )
                    ) : (
                      <span className="block break-words font-medium text-slate-900 whitespace-pre-wrap">
                        {display !== "" ? display : "—"}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-wrap justify-end gap-1 pt-1">
                  <RowActionButtons
                    row={row}
                    override={override}
                    editing={isEditing}
                    onEdit={() => startEdit(row)}
                    onSave={() => saveEdit(row)}
                    onCancel={cancelEdit}
                    copyFlash={flashId === row.id}
                    onCopy={() => void handleCopyRow(row)}
                  />
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
