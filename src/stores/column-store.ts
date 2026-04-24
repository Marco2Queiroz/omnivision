import type { DashboardTabId } from "@/lib/dashboard-tabs";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export type ColumnId =
  | "gantt"
  | "name"
  | "portfolio"
  | "area"
  | "sponsor"
  | "status"
  | "hours"
  | "capex"
  | "start"
  | "end"
  | "actions";

export const ALL_COLUMNS: ColumnId[] = [
  "gantt",
  "name",
  "portfolio",
  "area",
  "sponsor",
  "status",
  "hours",
  "capex",
  "start",
  "end",
  "actions",
];

const BASE_ORDER: ColumnId[] = ALL_COLUMNS.filter((c) => c !== "portfolio");

type TabState = {
  /** Ordem completa (visíveis + ocultas). Ocultar não altera a posição. */
  columnOrder: ColumnId[];
  /** Colunas atualmente ocultas. */
  hidden: ColumnId[];
  columnWidths: Partial<Record<ColumnId, number>>;
};

/** Legado: `visible` + `hiddenStack`. */
type LegacyTabState = {
  visible?: ColumnId[];
  hiddenStack?: ColumnId[];
  columnWidths?: Partial<Record<ColumnId, number>>;
};

function defaultTabState(): TabState {
  return {
    columnOrder: normalizeVisibleOrder([...BASE_ORDER]),
    hidden: [],
    columnWidths: {},
  };
}

/**
 * Coluna "Time" (id `portfolio`) fica fora do padrão: só roteamento no import.
 */
export function defaultVisibleForTab(tab: DashboardTabId): ColumnId[] {
  void tab;
  return getVisibleFromState(defaultTabState());
}

/**
 * Ações (expandir descrição) fixa à esquerda; Gantt à direita (última coluna).
 */
export function normalizeVisibleOrder(cols: ColumnId[]): ColumnId[] {
  const hasGantt = cols.includes("gantt");
  const withoutGantt = cols.filter((c) => c !== "gantt");
  const hasActions = withoutGantt.includes("actions");
  const middle = withoutGantt.filter((c) => c !== "actions");
  const withActions = hasActions
    ? (["actions", ...middle] as ColumnId[])
    : middle;
  return hasGantt ? ([...withActions, "gantt"] as ColumnId[]) : withActions;
}

/** Ordem de exibição: filtra `hidden` e aplica regras Gantt/Ações. */
export function getVisibleFromState(t: TabState): ColumnId[] {
  const vis = t.columnOrder.filter((c) => !t.hidden.includes(c));
  return normalizeVisibleOrder(vis);
}

/**
 * Após reordenar só as colunas visíveis, reintegra as ocultas na mesma posição
 * relativa do `columnOrder` anterior.
 */
function mergeOrderAfterVisibleReorder(
  oldOrder: ColumnId[],
  hidden: ColumnId[],
  newVisible: ColumnId[],
): ColumnId[] {
  const hset = new Set(hidden);
  let i = 0;
  return oldOrder.map((c) => (hset.has(c) ? c : newVisible[i++]));
}

export function migrateTabState(raw: unknown): TabState {
  const d = (raw ?? {}) as TabState & LegacyTabState;
  if (
    Array.isArray(d.columnOrder) &&
    d.columnOrder.length > 0 &&
    Array.isArray(d.hidden)
  ) {
    let order = d.columnOrder.filter(
      (c: ColumnId) => BASE_ORDER.includes(c),
    ) as ColumnId[];
    const seen = new Set(order);
    for (const c of BASE_ORDER) {
      if (!seen.has(c)) {
        order = [...order, c];
        seen.add(c);
      }
    }
    return {
      columnOrder: normalizeVisibleOrder(order),
      hidden: Array.from(
        new Set(
          (d.hidden as ColumnId[]).filter((c) => BASE_ORDER.includes(c)),
        ),
      ),
      columnWidths:
        d.columnWidths && typeof d.columnWidths === "object"
          ? d.columnWidths
          : {},
    };
  }
  const vis =
    Array.isArray(d.visible) && d.visible.length > 0
      ? d.visible
      : defaultTabState().columnOrder;
  const inVis = new Set(vis);
  const full = normalizeVisibleOrder([...BASE_ORDER]);
  const missing = full.filter((c) => !inVis.has(c));
  return {
    columnOrder: normalizeVisibleOrder([...vis, ...missing]),
    hidden: missing,
    columnWidths:
      d.columnWidths && typeof d.columnWidths === "object"
        ? d.columnWidths
        : {},
  };
}

type ColumnStore = {
  byTab: Record<string, TabState>;
  hideColumn: (tab: DashboardTabId, col: ColumnId) => void;
  showColumn: (tab: DashboardTabId, col: ColumnId) => void;
  toggleColumnVisibility: (tab: DashboardTabId, col: ColumnId) => void;
  restoreHidden: (tab: DashboardTabId) => void;
  isVisible: (tab: DashboardTabId, col: ColumnId) => boolean;
  hiddenCount: (tab: DashboardTabId) => number;
  setColumnWidthPx: (
    tab: DashboardTabId,
    col: ColumnId,
    px: number,
  ) => void;
  reorderVisibleColumns: (
    tab: DashboardTabId,
    fromIndex: number,
    toIndex: number,
  ) => void;
  ensureGanttLast: (tab: DashboardTabId) => void;
};

function getTab(s: ColumnStore, tab: DashboardTabId): TabState {
  const raw = s.byTab[tab];
  if (!raw) return defaultTabState();
  return migrateTabState(raw);
}

export const useColumnStore = create<ColumnStore>()(
  persist(
    (set, get) => ({
      byTab: {},

      isVisible(tab, col) {
        const t = getTab(get(), tab);
        return t.columnOrder.includes(col) && !t.hidden.includes(col);
      },

      hiddenCount(tab) {
        return getTab(get(), tab).hidden.length;
      },

      hideColumn(tab, col) {
        if (col === "gantt") return;
        set((state) => {
          const t = { ...getTab(state, tab) };
          if (!t.columnOrder.includes(col) || t.hidden.includes(col)) {
            return state;
          }
          t.hidden = [...t.hidden, col];
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      showColumn(tab, col) {
        if (col === "gantt") return;
        set((state) => {
          const t = { ...getTab(state, tab) };
          if (!t.hidden.includes(col)) return state;
          t.hidden = t.hidden.filter((c) => c !== col);
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      toggleColumnVisibility(tab, col) {
        if (col === "gantt") return;
        set((state) => {
          const t = { ...getTab(state, tab) };
          if (t.hidden.includes(col)) {
            t.hidden = t.hidden.filter((c) => c !== col);
          } else {
            if (!t.columnOrder.includes(col) || t.hidden.includes(col)) {
              return state;
            }
            t.hidden = [...t.hidden, col];
          }
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      /** Compat: remove o último id da lista de ocultas (LIFO) — raro na UI. */
      restoreHidden(tab) {
        set((state) => {
          const t = { ...getTab(state, tab) };
          if (t.hidden.length === 0) return state;
          t.hidden = t.hidden.slice(0, -1);
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      setColumnWidthPx(tab, col, px) {
        set((state) => {
          const t = { ...getTab(state, tab) };
          t.columnWidths = { ...t.columnWidths, [col]: px };
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      reorderVisibleColumns(tab, fromIndex, toIndex) {
        set((state) => {
          const t = { ...getTab(state, tab) };
          const visible = getVisibleFromState(t);
          const v = [...visible];
          if (
            fromIndex < 0 ||
            fromIndex >= v.length ||
            toIndex < 0 ||
            toIndex >= v.length
          ) {
            return state;
          }
          if (v[fromIndex] === "gantt" || v[toIndex] === "gantt") {
            return state;
          }
          if (v[fromIndex] === "actions" || v[toIndex] === "actions") {
            return state;
          }
          const [moved] = v.splice(fromIndex, 1);
          v.splice(toIndex, 0, moved);
          t.columnOrder = normalizeVisibleOrder(
            mergeOrderAfterVisibleReorder(
              t.columnOrder,
              t.hidden,
              v,
            ),
          );
          return { byTab: { ...state.byTab, [tab]: t } };
        });
      },

      ensureGanttLast(tab) {
        set((state) => {
          const t = { ...getTab(state, tab) };
          const next = normalizeVisibleOrder(t.columnOrder);
          if (
            next.length === t.columnOrder.length &&
            next.every((c, i) => c === t.columnOrder[i])
          ) {
            return state;
          }
          return {
            byTab: {
              ...state.byTab,
              [tab]: { ...t, columnOrder: next },
            },
          };
        });
      },
    }),
    {
      name: "vamos-column-prefs",
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ byTab: s.byTab }),
    },
  ),
);
