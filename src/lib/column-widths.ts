import type { ColumnId } from "@/stores/column-store";

const MIN_PX: Record<ColumnId, number> = {
  gantt: 120,
  name: 120,
  portfolio: 100,
  area: 96,
  sponsor: 96,
  status: 80,
  hours: 80,
  capex: 72,
  start: 88,
  end: 88,
  actions: 56,
};

const MAX_PX: Record<ColumnId, number> = {
  gantt: 2000,
  name: 560,
  portfolio: 400,
  area: 400,
  sponsor: 400,
  status: 320,
  hours: 240,
  capex: 240,
  start: 240,
  end: 240,
  actions: 80,
};

/** Larguras padrão alinhadas às classes min-w da tabela (px aprox.). */
export const COLUMN_WIDTH_DEFAULTS_PX: Record<ColumnId, number> = {
  gantt: 644,
  name: 200,
  portfolio: 140,
  area: 120,
  sponsor: 120,
  status: 100,
  hours: 100,
  capex: 90,
  start: 100,
  end: 100,
  actions: 56,
};

export function clampColumnWidthPx(col: ColumnId, px: number): number {
  const lo = MIN_PX[col];
  const hi = MAX_PX[col];
  return Math.round(Math.min(hi, Math.max(lo, px)));
}

export function isColumnResizable(
  col: ColumnId,
  ganttPanelOpen: boolean,
): boolean {
  if (col === "actions") return false;
  if (col === "gantt" && !ganttPanelOpen) return false;
  return true;
}
