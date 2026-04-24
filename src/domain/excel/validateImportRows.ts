import type { ProjectRecord } from "@/types/project";

export type RowIssue = {
  rowIndex: number;
  field?: string;
  message: string;
  severity: "error" | "warning";
};

function parseDate(s: string | null): Date | null {
  if (!s?.trim()) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export function validateProjectRows(rows: ProjectRecord[]): RowIssue[] {
  const issues: RowIssue[] = [];
  rows.forEach((p, i) => {
    const idx = i + 2;
    if (!p.name?.trim()) {
      issues.push({
        rowIndex: idx,
        field: "name",
        message: "Nome do projeto vazio.",
        severity: "error",
      });
    }
    if (p.startDate && !parseDate(p.startDate)) {
      issues.push({
        rowIndex: idx,
        field: "startDate",
        message: `Data início inválida: ${p.startDate}`,
        severity: "error",
      });
    }
    if (p.endDate && !parseDate(p.endDate)) {
      issues.push({
        rowIndex: idx,
        field: "endDate",
        message: `Data fim inválida: ${p.endDate}`,
        severity: "error",
      });
    }
    if (p.plannedHours < 0 || p.actualHours < 0) {
      issues.push({
        rowIndex: idx,
        field: "hours",
        message: "Horas negativas.",
        severity: "warning",
      });
    }
  });
  return issues;
}

export function summarizeDates(rows: ProjectRecord[]) {
  let withStart = 0;
  let withEnd = 0;
  let withoutAny = 0;
  for (const p of rows) {
    const hs = Boolean(p.startDate?.trim());
    const he = Boolean(p.endDate?.trim());
    if (hs) withStart += 1;
    if (he) withEnd += 1;
    if (!hs && !he) withoutAny += 1;
  }
  return { withStart, withEnd, withoutAny, total: rows.length };
}
