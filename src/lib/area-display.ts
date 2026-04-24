import { EXCEL_COLUMN_LABEL } from "@/lib/dashboard-excel-column-labels";
import type { DashboardTabId } from "@/lib/dashboard-tabs";

/**
 * Na aba Projetos, valores de área costumam vir como "Projetos N" — exibe só o número.
 */
export function displayAreaCell(tab: DashboardTabId, area: string): string {
  if (tab !== "projetos" || !area?.trim()) return area;
  const s = area.trim();
  if (/^projetos\b/i.test(s)) {
    const digits = s.match(/\d+/);
    return digits ? digits[0] : "—";
  }
  return area;
}

/** Rótulo alinhado à coluna do Excel "Área solicitante" (recebe aba p/ rótulo futuro). */
export function areaColumnLabel(tab: DashboardTabId): string {
  void tab;
  return EXCEL_COLUMN_LABEL.area;
}
