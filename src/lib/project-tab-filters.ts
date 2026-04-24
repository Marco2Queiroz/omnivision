import { DASHBOARD_TABS, type DashboardTabId } from "@/lib/dashboard-tabs";
import type { ProjectRecord } from "@/types/project";

function normKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function compactDados(s: string): string {
  return s.replace(/\s*\|\s*/g, "|").replace(/\s+/g, " ").trim();
}

/**
 * Valores em `portfolio_segment` (coluna A) aceitos além do rótulo exato
 * de {@link DASHBOARD_TABS} (tudo após normalizar).
 */
const TAB_SEGMENT_ALIASES: Record<DashboardTabId, readonly string[]> = {
  todos: [],
  operacional: [
    "operacional",
    "operacao",
    "operacoes",
    "operational",
  ],
  tatica: ["tatica", "tatico", "tactical", "tatico"],
  estrategica: [
    "estrategica",
    "estratégica",
    "estratejica",
    "strategic",
    "estrategia",
  ],
  projetos: ["projetos", "porjetos"],
  seguranca: ["seguranca da informacao", "seguranca"],
  governanca: ["governanca"],
  dados: ["dados", "ia | rpa | dados", "ia rpa dados"],
  "field-service": ["field service", "field"],
} as const;

/**
 * A coluna A do Excel (persistida em `portfolioSegment`) iguala o rótulo da
 * aba (ex.: "Projetos") ou variação listada em {@link TAB_SEGMENT_ALIASES}
 * (normalização sem acentos, minúsculas, espaços mínimos). Também aceita o
 * `id` da aba, ex. `projetos` ou `field-service`.
 */
export function segmentMatchesDashboardTab(
  raw: string,
  tab: DashboardTabId,
): boolean {
  if (tab === "todos") return true;
  const def = DASHBOARD_TABS.find((t) => t.id === tab);
  if (!def) return false;

  const n = normKey(raw);
  if (!n) return false;

  if (n === normKey(def.label)) return true;
  if (n === tab) return true;

  if (tab === "dados") {
    if (compactDados(n) === compactDados(normKey(def.label))) return true;
  }

  for (const a of TAB_SEGMENT_ALIASES[tab] ?? []) {
    if (n === normKey(a) || n === a) return true;
  }

  return false;
}

function legacyFilter(p: ProjectRecord, tab: DashboardTabId): boolean {
  if (tab === "operacional") {
    const s = (a: string) => a.toLowerCase();
    return (
      s(p.area).includes("operacional") ||
      s(p.area).includes("operac") ||
      s(p.category).includes("operacional")
    );
  }

  if (tab === "tatica") {
    const s = (a: string) => a.toLowerCase();
    return (
      s(p.area).includes("tatic") || s(p.category).includes("tatic")
    );
  }

  if (tab === "estrategica") {
    const s = (a: string) => a.toLowerCase();
    return (
      s(p.area).includes("estrat") ||
      s(p.category).includes("estrat")
    );
  }

  if (tab === "projetos") {
    return p.category === "Projetos" || p.category.startsWith("Projetos ");
  }

  if (tab === "seguranca") {
    const s = (a: string) => a.toLowerCase();
    return s(p.area).includes("segurança") || s(p.area).includes("seguranca");
  }

  if (tab === "governanca") {
    const s = (a: string) => a.toLowerCase();
    return (
      s(p.area).includes("governanç") ||
      s(p.area).includes("governanca") ||
      s(p.category).includes("governanç") ||
      s(p.category).includes("governanca")
    );
  }

  if (tab === "dados") {
    return p.area === "Dados";
  }

  if (tab === "field-service") {
    return (
      p.area.toLowerCase().includes("field") || p.area === "Field Service"
    );
  }

  return true;
}

/**
 * Filtra o portfólio pela aba do dashboard.
 * Com `portfolioSegment` (coluna A do Excel), o texto deve bater com o
 * rótulo da aba. Sem segmento, mantém regras legadas (área/categoria).
 */
export function filterProjectsByTab(
  projects: ProjectRecord[],
  tab: DashboardTabId,
): ProjectRecord[] {
  if (tab === "todos") return projects;

  return projects.filter((p) => {
    const seg = (p.portfolioSegment ?? "").trim();
    if (seg) {
      return segmentMatchesDashboardTab(seg, tab);
    }
    return legacyFilter(p, tab);
  });
}
