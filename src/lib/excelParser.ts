import * as XLSX from "xlsx";

export type SheetMatrix = (string | number | boolean | null | undefined)[][];

/** Colunas A–K (índices 0–10); demais ignoradas no import de portfólio. */
export const EXCEL_MAX_COLUMN_INDEX = 10;

export type ExcelMatrixRow = {
  /**
   * Valor da coluna cujo cabeçalho (linha 1) é "Time" — rótulo da aba/área; não
   * é coluna de exibição na tela. Persistido em `ProjectRecord.portfolioSegment`.
   */
  portfolioSegment: string;
  /** Colunas A–K: rótulo da 1.ª linha (cabeçalho) → valor. Ordem qualquer. */
  fields: Record<string, string>;
  /** Texto bruto da 2.ª coluna (índice 1) — reserva para fallback do nome. */
  columnBRaw: string;
};

function normHeaderKey(h: string): string {
  return h
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

/** Valor na coluna "Time" (cabeçalho), para roteamento de aba. */
export function timeValueFromRowFields(
  fields: Record<string, string>,
): string {
  for (const [k, v] of Object.entries(fields)) {
    if (normHeaderKey(k) === "time") return String(v ?? "").trim();
  }
  return "";
}

/**
 * Lê a primeira folha ou nome informado; retorna matriz bruta.
 */
export function parseWorkbookToMatrix(
  buffer: ArrayBuffer,
  sheetName?: string,
): { sheetNames: string[]; matrix: SheetMatrix; usedSheet: string } {
  const wb = XLSX.read(buffer, { type: "array", cellDates: true });
  const sheetNames = wb.SheetNames;
  const name = sheetName && sheetNames.includes(sheetName)
    ? sheetName
    : sheetNames[0]!;
  const ws = wb.Sheets[name]!;
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(ws, {
    header: 1,
    defval: null,
    raw: false,
  }) as SheetMatrix;
  return { sheetNames, matrix, usedSheet: name };
}

/**
 * Primeira linha = cabeçalhos (todas as colunas). Uso genérico sem limite A–K.
 */
export function matrixToObjects(matrix: SheetMatrix): Record<string, string>[] {
  if (matrix.length < 2) return [];
  const headers = matrix[0]!.map((h) => String(h ?? "").trim());
  const rows: Record<string, string>[] = [];
  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r]!;
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const cell = row[c];
      obj[key] =
        cell === null || cell === undefined ? "" : String(cell).trim();
    }
    rows.push(obj);
  }
  return rows;
}

/**
 * Import portfólio: só colunas A–K. Linha 1 = cabeçalhos; a correspondência
 * com o sistema é pelo *nome* do cabeçalho (independente da ordem). A coluna
 * "Time" define o roteamento para as abas (`portfolioSegment`). "Nome do
 * projeto" e demais mapeiam nos campos internos.
 */
export function matrixToPortfolioRows(matrix: SheetMatrix): ExcelMatrixRow[] {
  if (matrix.length < 2) return [];
  const headerRow = matrix[0] ?? [];
  const headers = headerRow
    .slice(0, EXCEL_MAX_COLUMN_INDEX + 1)
    .map((h) => String(h ?? "").trim());
  const rows: ExcelMatrixRow[] = [];

  for (let r = 1; r < matrix.length; r++) {
    const row = matrix[r] ?? [];
    const slice = row.slice(0, EXCEL_MAX_COLUMN_INDEX + 1);
    const obj: Record<string, string> = {};
    for (let c = 0; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const cell = slice[c];
      obj[key] =
        cell === null || cell === undefined ? "" : String(cell).trim();
    }
    const portfolioSegment = timeValueFromRowFields(obj);
    const columnBRaw = String(slice[1] ?? "").trim();
    rows.push({ portfolioSegment, fields: obj, columnBRaw });
  }
  return rows;
}
