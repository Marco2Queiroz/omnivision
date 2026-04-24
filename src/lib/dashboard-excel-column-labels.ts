import type { DashboardTabId } from "@/lib/dashboard-tabs";
import type { ColumnId } from "@/stores/column-store";

/**
 * Rótulos da tela alinhados ao cabeçalho padrão do Excel (A–K).
 * A 1.ª coluna (Time) não aparece na grade; não há entrada aqui.
 */
export const EXCEL_COLUMN_LABEL = {
  name: "Nome do projeto",
  area: "Área solicitante",
  sponsor: "Gestor",
  status: "Status",
  /** Horas estimadas (planilha: "Horas", "Horas estimadas", etc.) */
  hours: "Horas estimadas",
  capex: "Capex",
  start: "Data início",
  end: "Data de entrega",
} as const;

export function sortableTableColumnLabel(
  _tab: DashboardTabId,
  col: ColumnId,
): string {
  switch (col) {
    case "name":
      return EXCEL_COLUMN_LABEL.name;
    case "area":
      return EXCEL_COLUMN_LABEL.area;
    case "sponsor":
      return EXCEL_COLUMN_LABEL.sponsor;
    case "status":
      return EXCEL_COLUMN_LABEL.status;
    case "hours":
      return EXCEL_COLUMN_LABEL.hours;
    case "capex":
      return EXCEL_COLUMN_LABEL.capex;
    case "start":
      return EXCEL_COLUMN_LABEL.start;
    case "end":
      return EXCEL_COLUMN_LABEL.end;
    case "gantt":
      return "Gantt";
    case "actions":
      return "Expandir";
    case "portfolio":
      return "Time";
    default:
      return String(col);
  }
}

export const COLUMN_VISIBILITY_LABEL: Record<ColumnId, string> = {
  gantt: "Gantt",
  name: EXCEL_COLUMN_LABEL.name,
  portfolio: "Time",
  area: EXCEL_COLUMN_LABEL.area,
  sponsor: EXCEL_COLUMN_LABEL.sponsor,
  status: EXCEL_COLUMN_LABEL.status,
  hours: EXCEL_COLUMN_LABEL.hours,
  capex: EXCEL_COLUMN_LABEL.capex,
  start: EXCEL_COLUMN_LABEL.start,
  end: EXCEL_COLUMN_LABEL.end,
  actions: "Expandir",
};
