import { projectCapexDisplay } from "@/lib/capexCalculator";
import type { ColumnId } from "@/stores/column-store";
import type { ProjectRecord } from "@/types/project";

export type SortDir = "asc" | "desc";

/** Colunas com texto/número/data pesquisáveis e ordenáveis (exc. Gantt / ações). */
export const FILTER_SORT_COLUMNS: ColumnId[] = [
  "name",
  "area",
  "sponsor",
  "status",
  "hours",
  "capex",
  "start",
  "end",
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function capexValue(p: ProjectRecord, hourValue: number): number {
  return projectCapexDisplay(p, hourValue);
}

function isEmptyDate(s: string | null | undefined): boolean {
  return !s?.trim();
}

/**
 * Filtro por coluna: texto contido (case/acento insensível), AND entre colunas.
 */
export function applyColumnFilters(
  projects: ProjectRecord[],
  filters: Partial<Record<ColumnId, string>>,
  hourValue: number,
): ProjectRecord[] {
  const entries = Object.entries(filters).filter(
    ([, v]) => v != null && String(v).trim() !== "",
  ) as [ColumnId, string][];
  if (entries.length === 0) return projects;

  return projects.filter((p) => {
    for (const [col, raw] of entries) {
      const q = norm(String(raw).trim());
      if (!q) continue;
      switch (col) {
        case "name":
          if (!norm(p.name).includes(q)) return false;
          break;
        case "portfolio": {
          const seg = (p.portfolioSegment ?? "").trim() || "—";
          if (!norm(seg).includes(q)) return false;
          break;
        }
        case "area":
          if (!norm(p.area).includes(q)) return false;
          break;
        case "sponsor":
          if (!norm(p.sponsor).includes(q)) return false;
          break;
        case "status":
          if (!norm(p.status).includes(q)) return false;
          break;
        case "hours": {
          const h = String(p.plannedHours);
          if (!norm(h).includes(q)) return false;
          break;
        }
        case "capex": {
          const c = capexValue(p, hourValue);
          const brl = new Intl.NumberFormat("pt-BR", {
            style: "currency",
            currency: "BRL",
          }).format(c);
          const noSym = c.toLocaleString("pt-BR", { minimumFractionDigits: 0 });
          const digits = q.replace(/\D/g, "");
          if (
            !norm(brl).includes(q) &&
            !norm(noSym).includes(q) &&
            !(digits && String(Math.round(c)).includes(digits))
          ) {
            return false;
          }
          break;
        }
        case "start": {
          const disp = p.startDate?.trim() ? p.startDate : "—";
          if (!norm(disp).includes(q)) return false;
          break;
        }
        case "end": {
          const disp = p.endDate?.trim() ? p.endDate : "—";
          if (!norm(disp).includes(q)) return false;
          break;
        }
        default:
          break;
      }
    }
    return true;
  });
}

function compare(
  a: ProjectRecord,
  b: ProjectRecord,
  col: ColumnId,
  dir: SortDir,
  hourValue: number,
): number {
  const m = dir === "asc" ? 1 : -1;
  switch (col) {
    case "name":
      return m * a.name.localeCompare(b.name, "pt-BR", { sensitivity: "base" });
    case "portfolio": {
      const sa = (a.portfolioSegment ?? "").trim() || "—";
      const sb = (b.portfolioSegment ?? "").trim() || "—";
      return m * sa.localeCompare(sb, "pt-BR", { sensitivity: "base" });
    }
    case "area":
      return m * a.area.localeCompare(b.area, "pt-BR", { sensitivity: "base" });
    case "sponsor":
      return (
        m * a.sponsor.localeCompare(b.sponsor, "pt-BR", { sensitivity: "base" })
      );
    case "status":
      return (
        m * a.status.localeCompare(b.status, "pt-BR", { sensitivity: "base" })
      );
    case "hours": {
      return m * (a.plannedHours - b.plannedHours);
    }
    case "capex": {
      const ca = capexValue(a, hourValue);
      const cb = capexValue(b, hourValue);
      return m * (ca - cb);
    }
    case "start": {
      const ea = isEmptyDate(a.startDate);
      const eb = isEmptyDate(b.startDate);
      if (ea && eb) return 0;
      if (ea) return 1;
      if (eb) return -1;
      const ta = new Date(a.startDate!).getTime();
      const tb = new Date(b.startDate!).getTime();
      return m * (ta - tb);
    }
    case "end": {
      const ea = isEmptyDate(a.endDate);
      const eb = isEmptyDate(b.endDate);
      if (ea && eb) return 0;
      if (ea) return 1;
      if (eb) return -1;
      const ta = new Date(a.endDate!).getTime();
      const tb = new Date(b.endDate!).getTime();
      return m * (ta - tb);
    }
    default:
      return 0;
  }
}

export function applyColumnSort(
  projects: ProjectRecord[],
  sortColumn: ColumnId | null,
  sortDir: SortDir,
  hourValue: number,
): ProjectRecord[] {
  if (!sortColumn || !FILTER_SORT_COLUMNS.includes(sortColumn)) {
    return projects;
  }
  const copy = [...projects];
  copy.sort((a, b) => compare(a, b, sortColumn, sortDir, hourValue));
  return copy;
}
