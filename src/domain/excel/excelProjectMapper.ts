import type { ExcelMatrixRow } from "@/lib/excelParser";
import type { ProjectRecord } from "@/types/project";

type NormalizedRow = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  area: string;
  sponsor: string;
  status: string;
  plannedHours: string;
  actualHours: string;
  description: string;
  updates: string;
  category: string;
  capex: string;
  attachment: string;
  client: string;
  milestone: string;
  phase: string;
  tags: string;
  link: string;
  kpi: string;
  risk: string;
  priority: string;
  team: string;
  resources: string;
  neighborhood: string;
};

/**
 * Novo padrão de colunas (2026) + aliases legados para planilhas antigas.
 * Chaves = header normalizado (sem acento, minúsculo) → campo interno.
 */
const COLUMN_ALIASES: Record<string, keyof NormalizedRow> = {
  /* ID */
  id: "id",

  /* Nome — "Nome do projeto" no Excel → campo name (coluna "Nome" na UI) */
  "nome do projeto": "name",
  nome: "name",
  projeto: "name",
  titulo: "name",
  "project name": "name",
  name: "name",

  /* Datas */
  "data início": "startDate",
  "data inicio": "startDate",
  início: "startDate",
  inicio: "startDate",
  "data de entrega": "endDate",
  "data fim": "endDate",
  fim: "endDate",

  /* Área: prioridade em `pickAreaFromRow` — "Área solicitante" manda no campo exibido */
  "área solicitante": "area",
  "area solicitante": "area",
  "área de negócio": "area",
  "area de negocio": "area",
  área: "area",
  area: "area",
  tipo: "category",
  categoria: "category",
  gestor: "sponsor",
  sponsor: "sponsor",
  patrocinador: "sponsor",
  status: "status",
  valor: "capex",
  capex: "capex",

  /* Texto — novo padrão: observação vs descrição */
  "observação / obs": "updates",
  "observacao / obs": "updates",
  "observação": "updates",
  observacao: "updates",
  obs: "updates",
  descrição: "description",
  descricao: "description",
  atualizações: "updates",
  atualizacoes: "updates",

  /* Extras */
  anexo: "attachment",
  cliente: "client",
  marco: "milestone",
  fase: "phase",
  tags: "tags",
  link: "link",
  kpi: "kpi",
  risco: "risk",
  prioridade: "priority",
  equipe: "team",
  recursos: "resources",
  bairro: "neighborhood",

  /* Horas — estimada (planejada) vs real */
  horas: "plannedHours",
  "horas estimadas": "plannedHours",
  "horas estimada": "plannedHours",
  "horas planejadas": "plannedHours",
  "horas planejado": "plannedHours",
  planejado: "plannedHours",
  "horas realizadas": "actualHours",
  realizado: "actualHours",
  "horas real": "actualHours",
};

const HEADER_TO_FIELD = (() => {
  const m = new Map<string, keyof NormalizedRow>();
  for (const [alias, field] of Object.entries(COLUMN_ALIASES)) {
    m.set(
      alias
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, ""),
      field,
    );
  }
  return m;
})();

function normalizeHeader(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/**
 * `area` no registro: valor da coluna "Área solicitante" se preenchida; senão
 * "Área de negócio"; senão "Área" / "Area" genéricos. Evita que "área" sobrescreva
 * o valor de "área solicitante" quando o objeto da linha itera fora de ordem.
 */
function pickAreaValueFromRow(row: Record<string, string>): string {
  const n = (h: string) => normalizeHeader(h);
  const order: string[] = [
    n("área solicitante"),
    n("área de negócio"),
    n("área"),
    n("area"),
  ];
  for (const want of order) {
    for (const [k, v] of Object.entries(row)) {
      if (n(k) === want) {
        const t = String(v ?? "").trim();
        if (t) return t;
      }
    }
  }
  return "";
}

/**
 * Converte uma linha { coluna planilha: valor } para chaves internas.
 * O cabeçalho "Time" é ignorado (só entra no roteamento, via `portfolioSegment`).
 */
export function mapSpreadsheetRow(
  row: Record<string, string>,
): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    if (normalizeHeader(k) === "time") continue;
    const key = HEADER_TO_FIELD.get(normalizeHeader(k));
    if (key) {
      if (key === "area") continue;
      out[key] = v;
    }
  }
  const area = pickAreaValueFromRow(row);
  if (area) {
    out.area = area;
  }
  return out;
}

function numFromCell(s: string): number {
  const n = Number(String(s).replace(",", ".").replace(/[^\d.-]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function rowToProjectRecord(
  row: Record<string, string>,
  index: number,
  /** Valor da coluna "Time" — roteamento de aba; se "Área" vazia, reaproveitamos. */
  portfolioSegment: string,
  /** 2.ª coluna (índice 1) — fallback do nome quando o cabeçalho do nome não mapeia. */
  columnBRaw?: string,
): ProjectRecord {
  const m = mapSpreadsheetRow(row);
  const fromMap = (m.name || "").trim();
  const fromColB = (columnBRaw ?? "").trim();
  const name = (fromMap || fromColB || `Projeto ${index + 1}`).trim();
  const rawId = (m.id || "").trim();
  const id = rawId.length > 0 ? rawId : `import-${index}`;
  const seg = portfolioSegment.trim();
  const areaFromSheet = (m.area || "").trim();
  const area = areaFromSheet || seg;

  const base: ProjectRecord = {
    id,
    name,
    category: (m.category || "Projetos").trim(),
    portfolioSegment: seg || undefined,
    area,
    sponsor: (m.sponsor || "").trim(),
    status: (m.status || "backlog").trim().toLowerCase().replace(/\s+/g, "_"),
    startDate: m.startDate?.trim() || null,
    endDate: m.endDate?.trim() || null,
    plannedHours: numFromCell(m.plannedHours || "0"),
    actualHours: numFromCell(m.actualHours || "0"),
    capex: numFromCell(m.capex || "0"),
    description: (m.description || "").trim(),
    updates: (m.updates || "").trim(),
  };

  const extras: Partial<ProjectRecord> = {};
  const set = (key: keyof ProjectRecord, val: string | undefined) => {
    const t = val?.trim();
    if (t) (extras as Record<string, string>)[key as string] = t;
  };

  set("attachment", m.attachment);
  set("client", m.client);
  set("milestone", m.milestone);
  set("phase", m.phase);
  set("tags", m.tags);
  set("link", m.link);
  set("kpi", m.kpi);
  set("risk", m.risk);
  set("priority", m.priority);
  set("team", m.team);
  set("resources", m.resources);
  set("neighborhood", m.neighborhood);

  return { ...base, ...extras };
}

/**
 * Linha importável: nome vindo de cabeçalho mapeado (p.ex. "Nome do projeto") **ou**
 * reserva na 2.ª coluna, se a linha tiver dados mínimos.
 */
export function isPortfolioRowWithNameInNameColumn(
  row: ExcelMatrixRow,
): boolean {
  const m = mapSpreadsheetRow(row.fields);
  if ((m.name ?? "").trim().length > 0) return true;
  return (row.columnBRaw ?? "").trim().length > 0;
}

export function mapRowsToProjects(rows: ExcelMatrixRow[]): ProjectRecord[] {
  return rows.map((r, i) =>
    rowToProjectRecord(r.fields, i, r.portfolioSegment, r.columnBRaw),
  );
}
