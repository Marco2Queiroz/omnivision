"use client";

import {
  ALL_COLUMNS,
  useColumnStore,
  type ColumnId,
} from "@/stores/column-store";
import type { DashboardTabId } from "@/lib/dashboard-tabs";
import { COLUMN_VISIBILITY_LABEL } from "@/lib/dashboard-excel-column-labels";
import { cn } from "@/lib/utils";
import { Eye, EyeOff, ListFilter } from "lucide-react";

/** Gantt não oculta; Time (portfolio) não tem coluna na grade — não exibir opção. */
const TOGGLABLE_COLUMNS: ColumnId[] = ALL_COLUMNS.filter(
  (c) => c !== "gantt" && c !== "portfolio",
);

function FilterRowToggle({
  active,
  onToggle,
}: {
  active: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`inline-flex shrink-0 rounded-md p-1.5 hover:bg-on-background/10 ${
        active ? "text-on-background" : "text-on-background/80"
      }`}
      aria-pressed={active}
      title={
        active
          ? "Ocultar filtros e opções de colunas"
          : "Mostrar filtros e opções de colunas"
      }
      aria-label={
        active
          ? "Ocultar linha de filtros e opções de visibilidade de colunas"
          : "Mostrar linha de filtros e opções de visibilidade de colunas"
      }
    >
      <ListFilter className="h-4 w-4" aria-hidden />
    </button>
  );
}

type Props = {
  tab: DashboardTabId;
  /** Controlo de painel: filtros da tabela + opções de olho (visível/oculto). */
  panelOpen: boolean;
  onTogglePanel: () => void;
  className?: string;
};

export function ColumnVisibilityManager({
  tab,
  panelOpen,
  onTogglePanel,
  className,
}: Props) {
  const isVisible = useColumnStore((s) => s.isVisible);
  const toggleColumnVisibility = useColumnStore(
    (s) => s.toggleColumnVisibility,
  );

  return (
    <div
      className={cn("flex min-w-0 flex-1 flex-col gap-2", className)}
    >
      <div className="flex flex-wrap items-center gap-2">
        <FilterRowToggle active={panelOpen} onToggle={onTogglePanel} />
        {panelOpen
          ? TOGGLABLE_COLUMNS.map((col) => {
              const vis = isVisible(tab, col);
              return (
                <button
                  key={col}
                  type="button"
                  onClick={() => toggleColumnVisibility(tab, col)}
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded border px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wide transition",
                    vis
                      ? "border-line-field bg-surface-container-high/90 text-on-background"
                      : "border-red-600/90 bg-red-600 text-white shadow-sm",
                  )}
                  title={
                    vis
                      ? `Ocultar coluna ${COLUMN_VISIBILITY_LABEL[col]}`
                      : `Exibir coluna ${COLUMN_VISIBILITY_LABEL[col]}`
                  }
                  aria-pressed={!vis}
                  aria-label={
                    vis
                      ? `Ocultar coluna ${COLUMN_VISIBILITY_LABEL[col]}`
                      : `Exibir coluna ${COLUMN_VISIBILITY_LABEL[col]}`
                  }
                >
                  {vis ? (
                    <Eye className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  ) : (
                    <EyeOff className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  )}
                  {COLUMN_VISIBILITY_LABEL[col]}
                </button>
              );
            })
          : null}
      </div>
    </div>
  );
}
