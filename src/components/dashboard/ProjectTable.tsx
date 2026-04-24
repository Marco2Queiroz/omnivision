"use client";

import { ProjectExpansion } from "@/components/dashboard/ProjectExpansion";
import {
  GanttFixedMonthStrip,
  ProjectGanttRow,
} from "@/components/dashboard/ProjectGanttRow";
import {
  GANTT_MONTH_COUNT,
  displayColumnOrder,
  ganttTrackMinWidthPx,
} from "@/lib/gantt-timeline";
import { StatusBadge } from "@/components/dashboard/StatusBadge";
import { ColumnSortModal } from "@/components/dashboard/ColumnSortModal";
import { ColumnVisibilityManager } from "@/components/dashboard/ColumnVisibilityManager";
import { TableScrollFooter } from "@/components/dashboard/TableScrollFooter";
import { cn } from "@/lib/utils";
import { formatBrl, projectCapexDisplay } from "@/lib/capexCalculator";
import type { DashboardTabId } from "@/lib/dashboard-tabs";
import {
  EXCEL_COLUMN_LABEL,
  sortableTableColumnLabel,
} from "@/lib/dashboard-excel-column-labels";
import { displayAreaCell } from "@/lib/area-display";
import {
  applyColumnFilters,
  applyColumnSort,
  FILTER_SORT_COLUMNS,
  type SortDir,
} from "@/lib/project-table-query";
import {
  clampColumnWidthPx,
  COLUMN_WIDTH_DEFAULTS_PX,
  isColumnResizable,
} from "@/lib/column-widths";
import { useColumnStore, type ColumnId } from "@/stores/column-store";
import { useTabColumnPrefs } from "@/hooks/use-column-prefs-ssr-safe";
import type { ProjectRecord } from "@/types/project";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  GripVertical,
} from "lucide-react";
import {
  Fragment,
  useCallback,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useShallow } from "zustand/react/shallow";

/** Sombra suave à esquerda da coluna Gantt (separação visual da grade). */
const GANTT_EDGE_SHADOW =
  "shadow-[inset_12px_0_16px_-12px_rgb(0_0_0/0.08)]";

/** Offset do 2.º <tr> (filtros) abaixo do 1.º (títulos), p/ sticky. */
const STICKY_FILTER_OFFSET = "top-14";

const COL_MINW: Record<ColumnId, string> = {
  gantt: "min-w-[220px]",
  name: "min-w-[200px]",
  portfolio: "min-w-[140px]",
  area: "min-w-[120px]",
  sponsor: "min-w-[120px]",
  status: "min-w-[100px]",
  hours: "min-w-[100px]",
  capex: "min-w-[90px]",
  start: "min-w-[100px]",
  end: "min-w-[100px]",
  actions: "min-w-[4.5rem] w-14",
};

function colWidthClass(col: ColumnId, customWidth: boolean): string {
  return customWidth ? "min-w-0 max-w-none" : COL_MINW[col];
}

function columnWidthStyle(
  col: ColumnId,
  widthPx: number | undefined,
  ganttPanelOpen: boolean,
  ganttTrackPx: number,
): CSSProperties | undefined {
  if (col === "gantt" && !ganttPanelOpen) return undefined;
  if (widthPx != null && widthPx > 0) {
    return {
      width: widthPx,
      minWidth: widthPx,
      maxWidth: widthPx,
      boxSizing: "border-box",
    };
  }
  /* Gantt expandido sem largura salva: mínimo = faixa de meses → tabela pode ultrapassar a viewport e gerar scroll lateral. */
  if (col === "gantt" && ganttPanelOpen) {
    return {
      minWidth: ganttTrackPx + 20,
      boxSizing: "border-box",
    };
  }
  return undefined;
}

function buildHeaderCellClass(
  col: ColumnId,
  index: number,
  displayOrder: ColumnId[],
  draggingCol: ColumnId | null,
  ganttPanelOpen: boolean,
  customWidth: boolean,
): string {
  const n = displayOrder.length;
  const isFirst = index === 0;
  const isLast = index === n - 1;
  const wc = colWidthClass(col, customWidth);

  const parts: string[] = [];

  if (isFirst) {
    parts.push(
      `align-top sticky left-0 top-0 z-50 text-center ${wc} bg-surface-container-high px-3 py-3 shadow-sticky-edge shadow-[0_1px_0_0_rgba(0,0,0,0.06)]`,
    );
  } else if (col === "gantt") {
    parts.push(
      "align-top sticky top-0 z-30 border-l border-primary-container/40 bg-surface-container-high py-2 px-2 text-center shadow-[0_1px_0_0_rgba(0,0,0,0.06)]",
      GANTT_EDGE_SHADOW,
      ganttPanelOpen
        ? `${customWidth ? "min-w-0" : COL_MINW.gantt} min-w-0`
        : "w-10 min-w-[2.5rem]",
    );
  } else if (isLast) {
    parts.push(
      `align-top sticky right-0 top-0 z-30 border-l border-line-field/80 ${col === "name" ? "text-left" : "text-center"} ${wc} bg-surface-container-high px-3 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]`,
    );
  } else {
    parts.push(
      `align-top sticky top-0 z-30 ${col === "name" ? "text-left" : "text-center"} ${wc} bg-surface-container-high px-3 py-3 shadow-[0_1px_0_0_rgba(0,0,0,0.06)]`,
    );
  }

  if (draggingCol === col) parts.push("opacity-50");

  return parts.filter(Boolean).join(" ");
}

function buildFilterThClass(
  col: ColumnId,
  index: number,
  displayOrder: ColumnId[],
  ganttPanelOpen: boolean,
  customWidth: boolean,
): string {
  const n = displayOrder.length;
  const isFirst = index === 0;
  const isLast = index === n - 1;
  const wc = colWidthClass(col, customWidth);

  if (col === "gantt") {
    return (
      `align-top sticky border-l border-primary-container/40 bg-surface-container-high py-2 text-center ` +
      `${STICKY_FILTER_OFFSET} z-20 ` +
      GANTT_EDGE_SHADOW +
      " " +
      (ganttPanelOpen
        ? `${customWidth ? "min-w-0" : COL_MINW.gantt} px-2`
        : "w-10 min-w-[2.5rem] px-1")
    );
  }
  if (isFirst) {
    return `sticky left-0 z-40 text-center ${wc} bg-surface-container-high px-2 py-2 align-top shadow-sticky-edge ${STICKY_FILTER_OFFSET} shadow-sm`;
  }
  if (isLast) {
    return `sticky right-0 z-30 border-l border-line-field/80 ${col === "name" ? "text-left" : "text-center"} ${wc} bg-surface-container-high px-2 py-2 align-top ${STICKY_FILTER_OFFSET} shadow-sm`;
  }
  return `sticky z-30 ${col === "name" ? "text-left" : "text-center"} ${wc} bg-surface-container-high px-2 py-2 align-top ${STICKY_FILTER_OFFSET} shadow-sm`;
}

function bodyCellBaseClass(
  col: ColumnId,
  index: number,
  displayOrder: ColumnId[],
  ganttPanelOpen: boolean,
  customWidth: boolean,
): string {
  const n = displayOrder.length;
  const isFirst = index === 0;
  const isLast = index === n - 1;
  const wc = colWidthClass(col, customWidth);

  if (col === "gantt") {
    const base = `align-top border-l border-primary-container/30 bg-surface-dim/95 ${GANTT_EDGE_SHADOW}`;
    return `${base} px-2 py-3 text-center ${ganttPanelOpen ? `${customWidth ? "min-w-0" : COL_MINW.gantt} min-w-0` : "w-10 min-w-[2.5rem]"}`;
  }
  if (isFirst) {
    if (col === "actions") {
      return `sticky left-0 z-[1] ${wc} border-r border-line-field/20 bg-surface-dim text-center shadow-sticky-edge !px-2 align-middle py-3`;
    }
    return `sticky left-0 z-[1] ${wc} bg-surface-dim/95 text-center shadow-sticky-edge px-3 py-3`;
  }
  if (isLast) {
    return `sticky right-0 z-[2] border-l border-line-field/50 ${wc} bg-surface-dim/95 ${col === "name" ? "text-left" : "text-center"} px-3 py-3`;
  }
  if (col === "name") {
    return `${wc} px-3 py-3 text-left align-top`;
  }
  return `${wc} px-3 py-3 text-center align-top`;
}

type SortableColumnHeaderProps = {
  col: ColumnId;
  label: string;
  sortColumn: ColumnId | null;
  sortDir: SortDir;
  onOpenSort: (c: ColumnId) => void;
  /** Só com o painel de filtro/visibilidade aberto (ícone ListFilter). */
  showSortButton: boolean;
  /** Só "Nome do projeto" alinhado à esquerda. */
  alignWithTitle?: "left" | "center";
};

function SortableColumnHeader({
  col,
  label,
  sortColumn,
  sortDir,
  onOpenSort,
  showSortButton,
  alignWithTitle = "center",
}: SortableColumnHeaderProps) {
  const active = sortColumn === col;
  const alignL = alignWithTitle === "left";
  return (
    <div
      className={cn(
        "inline-flex min-w-0 w-full max-w-full gap-1.5",
        alignL
          ? "items-center justify-start text-left"
          : "items-center justify-center text-center",
      )}
    >
      <span
        className={cn(
          "min-w-0 shrink whitespace-nowrap font-headline text-[10px] uppercase tracking-widest",
          alignL ? "text-left" : "text-center",
          active
            ? "text-on-surface underline decoration-primary decoration-2 underline-offset-2"
            : "text-on-surface",
        )}
      >
        {label}
      </span>
      {showSortButton ? (
        <button
          type="button"
          onClick={() => onOpenSort(col)}
          className="inline-flex shrink-0 rounded p-0.5 text-on-surface hover:bg-on-surface/10"
          aria-label={`Ordenar por ${label}`}
          title="Ordenação"
        >
          {active ? (
            sortDir === "asc" ? (
              <ArrowUp className="h-3.5 w-3.5 shrink-0" />
            ) : (
              <ArrowDown className="h-3.5 w-3.5 shrink-0" />
            )
          ) : (
            <ArrowUpDown className="h-3.5 w-3.5 shrink-0 opacity-60" />
          )}
        </button>
      ) : null}
    </div>
  );
}

/** Alça na borda direita do cabeçalho (estilo Excel). */
function ColumnResizeHandle({
  onResizePointerDown,
}: {
  onResizePointerDown: (e: React.PointerEvent<HTMLSpanElement>) => void;
}) {
  return (
    <span
      role="separator"
      aria-orientation="vertical"
      aria-hidden
      tabIndex={-1}
      className="absolute right-0 top-0 z-[15] h-full w-2 translate-x-1/2 cursor-col-resize touch-none select-none hover:bg-primary/40"
      onPointerDown={onResizePointerDown}
      title="Arrastar para redimensionar a coluna"
    />
  );
}

type Props = {
  tab: DashboardTabId;
  projects: ProjectRecord[];
  /** Valor hora (R$) para CAPEX — vem de Configurações / padrão. */
  hourValue?: number;
  /** Master e Executivo: reordenar, redimensionar, visibilidade e linha de filtros. */
  allowTableCustomization?: boolean;
};

export function ProjectTable({
  tab,
  projects,
  hourValue = 150,
  allowTableCustomization = true,
}: Props) {
  const ui = allowTableCustomization;
  const [openId, setOpenId] = useState<string | null>(null);
  /** Painel Gantt à direita: expandido mostra o gráfico; recolhido só a faixa com ícone. */
  const [ganttPanelOpen, setGanttPanelOpen] = useState(false);
  const { orderedVisible, clientReady } = useTabColumnPrefs(tab);
  const columnWidths = useColumnStore(
    useShallow((s) =>
      clientReady ? (s.byTab[tab]?.columnWidths ?? {}) : {},
    ),
  );
  const setColumnWidthPx = useColumnStore((s) => s.setColumnWidthPx);
  const [resizePreview, setResizePreview] = useState<{
    col: ColumnId;
    width: number;
  } | null>(null);
  const lastResizeWidthRef = useRef(0);

  const widthPxForCol = useCallback(
    (col: ColumnId) => {
      if (resizePreview?.col === col) return resizePreview.width;
      return columnWidths[col];
    },
    [resizePreview, columnWidths],
  );

  const beginColumnResize = useCallback(
    (col: ColumnId, e: React.PointerEvent<HTMLSpanElement>) => {
      if (!ui) return;
      if (!isColumnResizable(col, ganttPanelOpen)) return;
      e.preventDefault();
      e.stopPropagation();
      const th = e.currentTarget.closest("th");
      const rect = th?.getBoundingClientRect();
      const stored = columnWidths[col];
      const startWidth =
        stored ??
        (rect?.width && rect.width > 1
          ? rect.width
          : COLUMN_WIDTH_DEFAULTS_PX[col]);
      const startX = e.clientX;
      lastResizeWidthRef.current = clampColumnWidthPx(col, startWidth);
      setResizePreview({
        col,
        width: lastResizeWidthRef.current,
      });

      const onMove = (ev: PointerEvent) => {
        const w = clampColumnWidthPx(
          col,
          startWidth + ev.clientX - startX,
        );
        lastResizeWidthRef.current = w;
        setResizePreview({ col, width: w });
      };
      const onUp = () => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.removeProperty("cursor");
        document.body.style.removeProperty("user-select");
        setColumnWidthPx(tab, col, lastResizeWidthRef.current);
        setResizePreview(null);
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [columnWidths, ganttPanelOpen, setColumnWidthPx, tab, ui],
  );

  const reorderVisibleColumns = useColumnStore((s) => s.reorderVisibleColumns);
  const dragFromIndex = useRef<number | null>(null);
  const [draggingCol, setDraggingCol] = useState<ColumnId | null>(null);
  const tableScrollRef = useRef<HTMLDivElement>(null);

  const [filtersRowVisible, setFiltersRowVisible] = useState(false);
  const [sortModalColumn, setSortModalColumn] = useState<ColumnId | null>(null);
  const [filters, setFilters] = useState<Partial<Record<ColumnId, string>>>({});
  const [sortColumn, setSortColumn] = useState<ColumnId | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  const displayed = useMemo(() => {
    const effectiveFilters = filtersRowVisible ? filters : {};
    let list = applyColumnFilters(projects, effectiveFilters, hourValue);
    if (sortColumn && FILTER_SORT_COLUMNS.includes(sortColumn)) {
      list = applyColumnSort(list, sortColumn, sortDir, hourValue);
    }
    return list;
  }, [
    projects,
    filters,
    filtersRowVisible,
    sortColumn,
    sortDir,
    hourValue,
  ]);

  const hasActiveFilters = useMemo(
    () =>
      Object.values(filters).some((v) => v != null && String(v).trim() !== ""),
    [filters],
  );

  const openSortModal = useCallback((col: ColumnId) => {
    if (!FILTER_SORT_COLUMNS.includes(col)) return;
    setSortModalColumn(col);
  }, []);

  const applySortFromModal = useCallback((col: ColumnId, dir: SortDir) => {
    setSortColumn(col);
    setSortDir(dir);
    setSortModalColumn(null);
  }, []);

  const closeSortModal = useCallback(() => setSortModalColumn(null), []);

  const toggleFiltersRow = useCallback(() => {
    setFiltersRowVisible((v) => !v);
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setSortColumn(null);
    setSortDir("asc");
    setSortModalColumn(null);
  }, []);

  const ganttInView = orderedVisible.includes("gantt");
  const monthCount = GANTT_MONTH_COUNT;
  const ganttTrackPx = useMemo(
    () => ganttTrackMinWidthPx(monthCount),
    [monthCount],
  );
  const totalColCount = orderedVisible.length;

  /** Ordem visual: Gantt sempre à direita (última coluna), alinhado ao store. */
  const displayOrder = useMemo(() => {
    const order = displayColumnOrder(orderedVisible);
    /** Coluna "Time" (import) não entra na grade: só roteamento interno. */
    return order.filter((c) => c !== "portfolio");
  }, [orderedVisible]);

  const ganttColumnIndex = useMemo(
    () => displayOrder.indexOf("gantt"),
    [displayOrder],
  );
  /** Detalhe expandido só ocupa colunas à esquerda do Gantt; não invade a faixa do gráfico. */
  const splitExpansionBelowGantt =
    ganttInView && ganttColumnIndex >= 1;

  const showSortInHeader = ui && filtersRowVisible;

  const showClearRow =
    sortColumn != null || (filtersRowVisible && hasActiveFilters);

  const handleColumnDrop = useCallback(
    (toIndex: number) => {
      if (!ui) return;
      const from = dragFromIndex.current;
      if (from == null || from === toIndex) return;
      reorderVisibleColumns(tab, from, toIndex);
      dragFromIndex.current = null;
      setDraggingCol(null);
    },
    [reorderVisibleColumns, tab, ui],
  );

  const handleColumnDragEnd = useCallback(() => {
    dragFromIndex.current = null;
    setDraggingCol(null);
  }, []);

  const onTableScroll = useCallback(() => {
    const el = tableScrollRef.current;
    if (!el) return;
    el.querySelectorAll<HTMLDivElement>("[data-gantt-sync]").forEach((g) => {
      g.scrollLeft = el.scrollLeft;
    });
  }, []);

  const onGanttScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    const root = tableScrollRef.current;
    if (root) root.scrollLeft = target.scrollLeft;
  }, []);

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <div className="mb-3 flex shrink-0 flex-wrap items-center justify-between gap-3">
        {ui ? (
          <ColumnVisibilityManager
            tab={tab}
            className="min-w-0 flex-1"
            panelOpen={filtersRowVisible}
            onTogglePanel={toggleFiltersRow}
          />
        ) : (
          <div className="min-w-0 flex-1" aria-hidden />
        )}
        {ganttInView ? (
          <div className="flex shrink-0 items-center gap-2">
            <span className="font-headline text-xs font-bold uppercase tracking-widest text-on-background">
              Gantt
            </span>
            <button
              type="button"
              onClick={() => setGanttPanelOpen((v) => !v)}
              className="inline-flex shrink-0 rounded-md border border-line-field bg-surface-container-high p-1.5 text-on-background hover:bg-on-background/10"
              title={
                ganttPanelOpen
                  ? "Recolher gráfico Gantt"
                  : "Expandir gráfico Gantt"
              }
              aria-expanded={ganttPanelOpen}
              aria-label={
                ganttPanelOpen
                  ? "Recolher coluna Gantt"
                  : "Expandir coluna Gantt"
              }
            >
              {ganttPanelOpen ? (
                <ChevronRight className="h-4 w-4" aria-hidden />
              ) : (
                <ChevronLeft className="h-4 w-4" aria-hidden />
              )}
            </button>
          </div>
        ) : null}
      </div>
      {showClearRow ? (
        <div className="mb-2 flex shrink-0 flex-wrap items-center justify-end gap-2">
          <button
            type="button"
            onClick={clearFilters}
            className="rounded-lg border border-line-field px-3 py-1.5 font-headline text-[10px] font-bold uppercase tracking-wider text-on-background hover:bg-on-background/10"
          >
            Limpar filtros e ordenação
          </button>
        </div>
      ) : null}
      <ColumnSortModal
        open={sortModalColumn != null}
        columnId={sortModalColumn}
        columnLabel={
          sortModalColumn ? sortableTableColumnLabel(tab, sortModalColumn) : ""
        }
        sortColumn={sortColumn}
        sortDir={sortDir}
        onClose={closeSortModal}
        onSelectSort={applySortFromModal}
      />
      <div
        ref={tableScrollRef}
        onScroll={onTableScroll}
        className="min-h-0 min-w-0 w-full flex-1 overflow-auto rounded-xl bg-surface-container/30 shadow-ambient touch-pan-x [scrollbar-gutter:stable] pb-4"
      >
        <table
          className={cn(
            "border-separate border-spacing-0 text-center text-sm",
            ganttPanelOpen && ganttInView
              ? "w-max min-w-full table-auto"
              : "w-full min-w-[1100px] table-fixed",
          )}
        >
          <thead className="relative z-20 bg-surface-container-high/90 text-center text-[10px] font-bold uppercase tracking-widest text-on-surface">
            <tr>
              {displayOrder.map((col, index) => {
                const customWidth =
                  widthPxForCol(col) != null ||
                  (col === "gantt" && ganttPanelOpen);
                const thClass = buildHeaderCellClass(
                  col,
                  index,
                  displayOrder,
                  draggingCol,
                  ganttPanelOpen,
                  customWidth,
                );
                const wStyle = columnWidthStyle(
                  col,
                  widthPxForCol(col),
                  ganttPanelOpen,
                  ganttTrackPx,
                );
                const storeIndex = orderedVisible.indexOf(col);
                return (
                  <th
                    key={col}
                    scope="col"
                    className={thClass}
                    style={wStyle}
                    onDragOver={
                      ui
                        ? (e) => {
                            if (col === "gantt" || col === "actions") {
                              e.dataTransfer.dropEffect = "none";
                              return;
                            }
                            e.preventDefault();
                            e.dataTransfer.dropEffect = "move";
                          }
                        : undefined
                    }
                    onDrop={
                      ui
                        ? (e) => {
                            if (col === "gantt" || col === "actions") {
                              e.preventDefault();
                              return;
                            }
                            e.preventDefault();
                            handleColumnDrop(storeIndex);
                          }
                        : undefined
                    }
                  >
                    {col === "gantt" ? (
                      ganttPanelOpen ? (
                        <div className="w-full min-w-0">
                          <div className="rounded-md border border-line-field bg-surface-container-low/40 p-1 ring-1 ring-inset ring-line-field/20">
                            <div
                              data-gantt-sync
                              onScroll={onGanttScroll}
                              className="max-w-full overflow-x-hidden overflow-y-hidden rounded border border-line-field/50"
                            >
                              <GanttFixedMonthStrip />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="sr-only">Gantt</span>
                      )
                    ) : col === "actions" ? (
                      <div
                        className={cn(
                          "flex h-full w-full min-w-0 items-center gap-1.5",
                          "justify-center text-center",
                        )}
                      >
                        <span
                          className="min-w-0 shrink whitespace-nowrap font-headline text-[10px] uppercase tracking-widest text-on-surface"
                          title="Expandir descrição"
                        >
                          {sortableTableColumnLabel(tab, "actions")}
                        </span>
                        <span className="sr-only">Expandir descrição do projeto</span>
                      </div>
                    ) : (
                      <div
                        className={cn(
                          "flex w-full min-w-0 items-center gap-1.5",
                          col === "name" ? "justify-start" : "justify-center",
                        )}
                      >
                        {showSortInHeader ? (
                          <span
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", col);
                              e.dataTransfer.effectAllowed = "move";
                              dragFromIndex.current =
                                orderedVisible.indexOf(col);
                              setDraggingCol(col);
                            }}
                            onDragEnd={handleColumnDragEnd}
                            className="inline-flex shrink-0 cursor-grab rounded p-0.5 text-on-surface-variant hover:text-on-surface active:cursor-grabbing"
                            title="Arrastar para reordenar coluna"
                            aria-label={`Reordenar coluna ${sortableTableColumnLabel(tab, col)}`}
                          >
                            <GripVertical className="h-3.5 w-3.5" aria-hidden />
                          </span>
                        ) : null}
                        <SortableColumnHeader
                          col={col}
                          label={sortableTableColumnLabel(tab, col)}
                          sortColumn={sortColumn}
                          sortDir={sortDir}
                          onOpenSort={openSortModal}
                          showSortButton={showSortInHeader}
                          alignWithTitle={col === "name" ? "left" : "center"}
                        />
                      </div>
                    )}
                    {ui && isColumnResizable(col, ganttPanelOpen) ? (
                      <ColumnResizeHandle
                        onResizePointerDown={(e) =>
                          beginColumnResize(col, e)
                        }
                      />
                    ) : null}
                  </th>
                );
              })}
            </tr>
            {filtersRowVisible ? (
              <tr className="bg-surface-container-high/70">
                {displayOrder.map((col, index) => {
                  const customWidth =
                    widthPxForCol(col) != null ||
                    (col === "gantt" && ganttPanelOpen);
                  const thF = buildFilterThClass(
                    col,
                    index,
                    displayOrder,
                    ganttPanelOpen,
                    customWidth,
                  );
                  const wStyle = columnWidthStyle(
                    col,
                    widthPxForCol(col),
                    ganttPanelOpen,
                    ganttTrackPx,
                  );
                  if (col === "gantt") {
                    return (
                      <th key={col} className={thF} style={wStyle} />
                    );
                  }
                  if (col === "actions") {
                    return (
                      <th key={col} className={thF} style={wStyle} />
                    );
                  }
                  return (
                    <th key={col} className={thF} style={wStyle}>
                      <input
                        type="search"
                        value={filters[col] ?? ""}
                        onChange={(e) =>
                          setFilters((f) => ({
                            ...f,
                            [col]: e.target.value,
                          }))
                        }
                        placeholder="Filtrar…"
                        aria-label={
                          col === "name"
                            ? `Filtrar ${EXCEL_COLUMN_LABEL.name.toLowerCase()}`
                            : col === "area"
                              ? `Filtrar ${EXCEL_COLUMN_LABEL.area.toLowerCase()}`
                              : col === "sponsor"
                                ? `Filtrar ${EXCEL_COLUMN_LABEL.sponsor.toLowerCase()}`
                                : col === "status"
                                  ? "Filtrar status"
                                  : col === "hours"
                                    ? "Filtrar horas"
                                    : col === "capex"
                                      ? `Filtrar ${EXCEL_COLUMN_LABEL.capex.toLowerCase()}`
                                      : col === "start"
                                        ? `Filtrar ${EXCEL_COLUMN_LABEL.start.toLowerCase()}`
                                        : `Filtrar ${EXCEL_COLUMN_LABEL.end.toLowerCase()}`
                        }
                        className="w-full min-w-0 rounded-md border border-line-field bg-surface-container-low px-2 py-1.5 text-left text-[11px] font-normal normal-case tracking-normal text-on-surface placeholder:text-on-surface-variant/70"
                      />
                    </th>
                  );
                })}
              </tr>
            ) : null}
          </thead>
          <tbody>
            {projects.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, totalColCount)}
                  className="px-4 py-10 text-center text-sm text-on-surface/90"
                >
                  <p className="font-medium text-on-surface">
                    Nenhum projeto nesta visão.
                  </p>
                </td>
              </tr>
            ) : null}
            {filtersRowVisible &&
            hasActiveFilters &&
            projects.length > 0 &&
            displayed.length === 0 ? (
              <tr>
                <td
                  colSpan={Math.max(1, totalColCount)}
                  className="px-4 py-8 text-center text-sm text-on-surface/90"
                >
                  <p className="font-medium text-on-surface">
                    Nenhum projeto corresponde aos filtros.
                  </p>
                  <button
                    type="button"
                    onClick={clearFilters}
                    className="mt-2 text-xs font-bold uppercase tracking-wider text-primary underline decoration-primary/50 underline-offset-2 hover:decoration-primary"
                  >
                    Limpar filtros e ordenação
                  </button>
                </td>
              </tr>
            ) : null}
            {displayed.map((p) => {
              const capex = projectCapexDisplay(p, hourValue);
              const expanded = openId === p.id;
              return (
                <Fragment key={p.id}>
                  <tr className="hover:bg-surface-container-low/40 even:bg-surface-container-low/[0.12]">
                    {displayOrder.map((col, index) => {
                      const customWidth =
                        widthPxForCol(col) != null ||
                        (col === "gantt" && ganttPanelOpen);
                      const base = bodyCellBaseClass(
                        col,
                        index,
                        displayOrder,
                        ganttPanelOpen,
                        customWidth,
                      );
                      const wStyle = columnWidthStyle(
                        col,
                        widthPxForCol(col),
                        ganttPanelOpen,
                        ganttTrackPx,
                      );
                      if (col === "gantt") {
                        return (
                          <td key={col} className={base} style={wStyle}>
                            {ganttPanelOpen ? (
                              <div className="rounded-md border border-line-field bg-surface-container-low/30 p-1 ring-1 ring-inset ring-line-field/20">
                                <div className="min-w-0">
                                  <ProjectGanttRow
                                    startDate={p.startDate}
                                    endDate={p.endDate}
                                    status={p.status}
                                    onScroll={onGanttScroll}
                                    trackMinWidthPx={ganttTrackPx}
                                  />
                                </div>
                              </div>
                            ) : null}
                          </td>
                        );
                      }
                      if (col === "name") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-left font-medium text-on-surface`}
                            style={wStyle}
                          >
                            {p.name}
                          </td>
                        );
                      }
                      if (col === "area") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center text-on-surface-variant`}
                            style={wStyle}
                          >
                            {displayAreaCell(tab, p.area)}
                          </td>
                        );
                      }
                      if (col === "sponsor") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center text-on-surface-variant`}
                            style={wStyle}
                          >
                            {p.sponsor}
                          </td>
                        );
                      }
                      if (col === "status") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center`}
                            style={wStyle}
                          >
                            <div className="flex w-full items-center justify-center">
                              <StatusBadge status={p.status} />
                            </div>
                          </td>
                        );
                      }
                      if (col === "hours") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center font-mono text-xs text-on-surface tabular-nums`}
                            style={wStyle}
                            title="Horas estimadas"
                          >
                            {p.plannedHours}
                          </td>
                        );
                      }
                      if (col === "capex") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center text-sm text-tertiary tabular-nums`}
                            style={wStyle}
                            title="Capex"
                          >
                            {formatBrl(capex)}
                          </td>
                        );
                      }
                      if (col === "start") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center text-xs text-on-surface-variant`}
                            style={wStyle}
                          >
                            {p.startDate ?? "—"}
                          </td>
                        );
                      }
                      if (col === "end") {
                        return (
                          <td
                            key={col}
                            className={`${base} text-center text-xs text-on-surface-variant`}
                            style={wStyle}
                          >
                            {p.endDate ?? "—"}
                          </td>
                        );
                      }
                      if (col === "actions") {
                        return (
                          <td
                            key={col}
                            className={cn(base, "!px-2 align-middle")}
                            style={wStyle}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                setOpenId((id) => (id === p.id ? null : p.id))
                              }
                              className="rounded p-1 text-on-surface hover:bg-on-surface/10"
                              aria-expanded={expanded}
                              aria-label={expanded ? "Recolher" : "Expandir"}
                            >
                              <ChevronDown
                                className={`h-5 w-5 transition ${expanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          </td>
                        );
                      }
                      return null;
                    })}
                  </tr>
                  {expanded ? (
                    <tr key={`${p.id}-exp`} className="border-t border-line-subtle/30">
                      {splitExpansionBelowGantt ? (
                        <>
                          <td
                            colSpan={ganttColumnIndex}
                            className="bg-surface-container/50 px-3 py-4 align-top"
                          >
                            <div className="min-w-0 max-w-full">
                              <ProjectExpansion project={p} />
                            </div>
                          </td>
                          <td
                            className={cn(
                              bodyCellBaseClass(
                                "gantt",
                                ganttColumnIndex,
                                displayOrder,
                                ganttPanelOpen,
                                widthPxForCol("gantt") != null ||
                                  ganttPanelOpen,
                              ),
                              "border-t border-primary-container/20 bg-surface-container/50 p-2 align-top",
                            )}
                            style={columnWidthStyle(
                              "gantt",
                              widthPxForCol("gantt"),
                              ganttPanelOpen,
                              ganttTrackPx,
                            )}
                            aria-hidden
                          />
                          {totalColCount - ganttColumnIndex - 1 > 0 ? (
                            <td
                              colSpan={
                                totalColCount - ganttColumnIndex - 1
                              }
                              className="border-t border-line-field/30 bg-surface-container/50 p-0 align-top"
                              aria-hidden
                            />
                          ) : null}
                        </>
                      ) : (
                        <td
                          colSpan={totalColCount}
                          className="bg-surface-container/50 px-3 py-4 align-top"
                        >
                          <div className="min-w-0 max-w-full">
                            <ProjectExpansion project={p} />
                          </div>
                        </td>
                      )}
                    </tr>
                  ) : null}
                </Fragment>
              );
            })}
          </tbody>
        </table>

      </div>
      <TableScrollFooter targetRef={tableScrollRef} />
    </div>
  );
}
