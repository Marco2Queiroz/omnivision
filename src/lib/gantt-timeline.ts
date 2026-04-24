import {
  normalizeVisibleOrder,
  type ColumnId,
} from "@/stores/column-store";

/**
 * Ordem visual da tabela: igual ao store — **Gantt sempre por último**, à direita das demais colunas.
 * Evita o Gantt no meio da grade (sobreposição com sticky/z-index ao rolar).
 */
export function displayColumnOrder(orderedVisible: ColumnId[]): ColumnId[] {
  return normalizeVisibleOrder([...orderedVisible]);
}

/** Último instante da grade anual (31/12/2026). */
export const GANTT_TIMELINE_END = new Date(2026, 11, 31, 23, 59, 59, 999);

/** Ano fixo da faixa Jan–Dez exibida no Gantt. */
export const GANTT_TIMELINE_YEAR = 2026;

const GANTT_YEAR = GANTT_TIMELINE_YEAR;

/** Rótulos fixos dos 12 meses (faixa dentro da coluna Gantt). */
export const GANTT_MONTH_LABELS = [
  "Jan",
  "Fev",
  "Mar",
  "Abr",
  "Mai",
  "Jun",
  "Jul",
  "Ago",
  "Set",
  "Out",
  "Nov",
  "Dez",
] as const;

export type GanttMonthColumn = {
  key: string;
  year: number;
  month: number;
  label: string;
};

export type GanttTimeline = {
  months: GanttMonthColumn[];
  rangeStart: Date;
  rangeEnd: Date;
};

/**
 * Grade fixa: jan–dez/2026. Barras usam início/fim do projeto recortados a esse intervalo.
 */
export function buildGanttTimeline(): GanttTimeline {
  const months: GanttMonthColumn[] = GANTT_MONTH_LABELS.map((label, m) => ({
    key: `${GANTT_YEAR}-${m}`,
    year: GANTT_YEAR,
    month: m,
    label,
  }));

  const rangeStart = new Date(GANTT_YEAR, 0, 1, 0, 0, 0, 0);
  const rangeEnd = GANTT_TIMELINE_END;

  return { months, rangeStart, rangeEnd };
}

export const GANTT_MONTH_COL_PX = 52;

export const GANTT_MONTH_COUNT = 12;

export function ganttTrackMinWidthPx(monthCount: number = GANTT_MONTH_COUNT): number {
  return Math.max(200, monthCount * GANTT_MONTH_COL_PX);
}

function ganttRangeBounds(): { rangeStart: Date; rangeEnd: Date } {
  return {
    rangeStart: new Date(GANTT_YEAR, 0, 1, 0, 0, 0, 0),
    rangeEnd: GANTT_TIMELINE_END,
  };
}

/** Abreviações 3–4 letras (planilha Excel em EN ou PT). */
const MONTH_ABBR_TO_INDEX: Record<string, number> = {
  jan: 0,
  fev: 1,
  feb: 1,
  mar: 2,
  abr: 3,
  apr: 3,
  mai: 4,
  may: 4,
  jun: 5,
  jul: 6,
  ago: 7,
  aug: 7,
  set: 8,
  sep: 8,
  sept: 8,
  out: 9,
  oct: 9,
  nov: 10,
  dez: 11,
  dec: 11,
};

function normalizeMonthKey(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

function expandTwoDigitYear(yy: number): number {
  if (yy >= 100) return yy;
  return 2000 + yy;
}

export type ParsedGanttDate = {
  /** Instante base (meia-noite do 1º dia se só mês/ano). */
  at: Date;
  /** Valor da célula era só mês + ano (ex.: Mar-26, mai/26). */
  monthYearOnly: boolean;
};

/**
 * Interpreta datas de projeto como vêm da planilha/Appwrite.
 * Cobre ISO, BR, e **mês-ano** estilo Excel (`Mar-26`, `mai/26`) — `Date.parse` nativo costuma falhar nesses.
 */
export function parseProjectDateForGantt(raw: string | null): ParsedGanttDate | null {
  if (!raw?.trim()) return null;
  const t = raw
    .trim()
    .replace(/[\u2013\u2014\u2212]/g, "-");

  const iso = /^(\d{4})-(\d{2})-(\d{2})/.exec(t);
  if (iso) {
    const y = Number(iso[1]);
    const m = Number(iso[2]) - 1;
    const d = Number(iso[3]);
    const dt = new Date(y, m, d);
    return Number.isNaN(dt.getTime())
      ? null
      : { at: dt, monthYearOnly: false };
  }

  const brFull = /^(\d{1,2})[/-](\d{1,2})[/-](\d{4})\s*$/.exec(t);
  if (brFull) {
    const day = Number(brFull[1]);
    const month = Number(brFull[2]) - 1;
    const year = Number(brFull[3]);
    const dt = new Date(year, month, day);
    return Number.isNaN(dt.getTime())
      ? null
      : { at: dt, monthYearOnly: false };
  }

  const brShort = /^(\d{1,2})[/-](\d{1,2})[/-](\d{2})\s*$/.exec(t);
  if (brShort) {
    const day = Number(brShort[1]);
    const month = Number(brShort[2]) - 1;
    const year = expandTwoDigitYear(Number(brShort[3]));
    const dt = new Date(year, month, day);
    return Number.isNaN(dt.getTime())
      ? null
      : { at: dt, monthYearOnly: false };
  }

  const mmmYear =
    /^([A-Za-zÀ-ÿ]{3,4})\s*[-/.]?\s*(\d{2}|\d{4})\s*$/.exec(t.replace(/\s+/g, " "));
  if (mmmYear) {
    const key = normalizeMonthKey(mmmYear[1]);
    const mi = MONTH_ABBR_TO_INDEX[key];
    if (mi !== undefined) {
      let yr = Number(mmmYear[2]);
      if (String(mmmYear[2]).length === 2) yr = expandTwoDigitYear(yr);
      if (yr < 1970 || yr > 2100) return null;
      const dt = new Date(yr, mi, 1);
      return Number.isNaN(dt.getTime())
        ? null
        : { at: dt, monthYearOnly: true };
    }
  }

  const fallback = new Date(t);
  if (!Number.isNaN(fallback.getTime())) {
    return { at: fallback, monthYearOnly: false };
  }
  return null;
}

/** Início do dia local (datas vindas da planilha/API costumam ser meia-noite). */
function startOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
}

/** Fim do dia local — intervalo de projeto é inclusivo no último dia. */
function endOfLocalDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}

function firstDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
}

function lastDayOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth() + 1, 0, 0, 0, 0, 0);
}

/** Se fim < início no mesmo ano civil, assume fim no ano seguinte (ex.: Nov-26 → Apr-26 = abr/2027). */
function alignEndAfterStartIfNeeded(start: Date, end: Date): Date {
  if (end.getTime() >= start.getTime()) return end;
  const out = new Date(end);
  out.setFullYear(out.getFullYear() + 1);
  return out;
}

/**
 * Converte strings de início/fim em intervalo de calendário para o Gantt.
 */
export function parseProjectIntervalForGantt(
  startRaw: string | null,
  endRaw: string | null,
): { start: Date; end: Date } | null {
  const ps = parseProjectDateForGantt(startRaw);
  if (!ps) return null;

  const start = ps.monthYearOnly ? firstDayOfMonth(ps.at) : startOfLocalDay(ps.at);

  const pe = parseProjectDateForGantt(endRaw);
  if (!pe) {
    if (ps.monthYearOnly) {
      const last = lastDayOfMonth(ps.at);
      return { start, end: endOfLocalDay(last) };
    }
    return { start, end: endOfLocalDay(ps.at) };
  }

  let end = pe.monthYearOnly
    ? endOfLocalDay(lastDayOfMonth(pe.at))
    : endOfLocalDay(pe.at);

  end = alignEndAfterStartIfNeeded(start, end);

  return { start, end };
}

/**
 * Interseção do intervalo do projeto com a faixa Jan–Dez do ano do Gantt.
 * Início/fim tratados como **dias de calendário inclusivos** (não só o instante 00:00 do fim).
 * Fora da faixa (ex.: projeto só em 2025) → `null`.
 */
export function effectiveProjectRangeOnGanttTimeline(
  start: Date,
  end: Date | null,
): { effStart: Date; effEnd: Date } | null {
  const { rangeStart, rangeEnd } = ganttRangeBounds();
  const projStart = startOfLocalDay(start);
  const projEndDay = end != null ? endOfLocalDay(end) : endOfLocalDay(start);
  const effStartMs = Math.max(projStart.getTime(), rangeStart.getTime());
  const effEndMs = Math.min(projEndDay.getTime(), rangeEnd.getTime());
  if (effStartMs > effEndMs) return null;
  return { effStart: new Date(effStartMs), effEnd: new Date(effEndMs) };
}

/**
 * Posição da barra na faixa anual (% da largura), **proporcional ao tempo** dentro do ano
 * (evita preencher meses inteiros quando só parte do mês pertence ao projeto).
 */
export function ganttBarPercentLayout(
  effStart: Date,
  effEnd: Date,
): { leftPct: number; widthPct: number } {
  const yearStart = new Date(GANTT_YEAR, 0, 1, 0, 0, 0, 0).getTime();
  const yearEndExclusive = new Date(GANTT_YEAR + 1, 0, 1, 0, 0, 0, 0).getTime();
  const totalMs = yearEndExclusive - yearStart;

  let s = effStart.getTime();
  let e = effEnd.getTime();
  s = Math.max(s, yearStart);
  e = Math.min(e, yearEndExclusive - 1);
  if (s > e) return { leftPct: 0, widthPct: 0 };

  const leftPct = ((s - yearStart) / totalMs) * 100;
  const widthPct = ((e + 1 - s) / totalMs) * 100;

  const clampedLeft = Math.max(0, Math.min(100, leftPct));
  const maxW = 100 - clampedLeft;
  const clampedW = Math.max(0, Math.min(maxW, widthPct));
  return { leftPct: clampedLeft, widthPct: clampedW };
}
