"use client";

import type { SortDir } from "@/lib/project-table-query";
import type { ColumnId } from "@/stores/column-store";
import { X } from "lucide-react";
import { useEffect } from "react";

type Props = {
  open: boolean;
  columnId: ColumnId | null;
  columnLabel: string;
  sortColumn: ColumnId | null;
  sortDir: SortDir;
  onClose: () => void;
  onSelectSort: (col: ColumnId, dir: SortDir) => void;
};

export function ColumnSortModal({
  open,
  columnId,
  columnLabel,
  sortColumn,
  sortDir,
  onClose,
  onSelectSort,
}: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open || !columnId) return null;

  const isActive = sortColumn === columnId;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="presentation"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="column-sort-modal-title"
        className="w-full max-w-md rounded-xl border border-line-field bg-surface-container p-4 shadow-ambient"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-2">
          <h2
            id="column-sort-modal-title"
            className="font-headline text-sm font-bold uppercase tracking-wide text-on-surface"
          >
            Ordenar por {columnLabel}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-outline hover:bg-surface-container-high"
            aria-label="Fechar"
          >
            <X className="h-4 w-4 shrink-0" />
          </button>
        </div>
        <p className="mt-2 text-xs text-on-surface-variant">
          Marque uma opção por vez (exclusiva).
        </p>
        <ul className="mt-4 space-y-2">
          <li>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-field px-3 py-2.5 hover:bg-surface-container-high/80 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-field accent-primary"
                checked={isActive && sortDir === "asc"}
                onChange={() => onSelectSort(columnId, "asc")}
              />
              <span className="text-sm leading-snug text-on-surface">
                Ordem crescente (A–Z, valores menores primeiro)
              </span>
            </label>
          </li>
          <li>
            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-line-field px-3 py-2.5 hover:bg-surface-container-high/80 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary">
              <input
                type="checkbox"
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-line-field accent-primary"
                checked={isActive && sortDir === "desc"}
                onChange={() => onSelectSort(columnId, "desc")}
              />
              <span className="text-sm leading-snug text-on-surface">
                Ordem decrescente (Z–A, valores maiores primeiro)
              </span>
            </label>
          </li>
        </ul>
      </div>
    </div>
  );
}
