import {
  isPortfolioRowWithNameInNameColumn,
  mapRowsToProjects,
} from "@/domain/excel/excelProjectMapper";
import {
  summarizeDates,
  validateProjectRows,
} from "@/domain/excel/validateImportRows";
import { checkApiRateLimit, getClientIp } from "@/lib/api-rate-limit";
import { matrixToPortfolioRows, parseWorkbookToMatrix } from "@/lib/excelParser";
import { getSettingsAuthContext } from "@/lib/settings-access";
import { runProjectImport } from "@/services/excel-import-service";
import type { ProjectRecord } from "@/types/project";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

/** Aba opcional (`NEXT_PUBLIC_EXCEL_IMPORT_SHEET`); se vazia, usa a 1ª planilha do arquivo. */
function getExcelSheetName(): string | undefined {
  const s = process.env.NEXT_PUBLIC_EXCEL_IMPORT_SHEET?.trim();
  return s || undefined;
}

const MAX_BYTES = 10 * 1024 * 1024;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const lim = checkApiRateLimit(ip, "post-import-excel");
  if (!lim.allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente de novo em instantes." },
      {
        status: 429,
        headers: { "Retry-After": String(lim.retryAfterSec) },
      },
    );
  }

  const auth = await getSettingsAuthContext();
  if (!auth.allowed) {
    return NextResponse.json(
      { error: "Não autorizado." },
      { status: auth.reason === "unauthenticated" ? 401 : 403 },
    );
  }

  const ct = request.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) {
    const body = (await request.json()) as {
      rows?: ProjectRecord[];
      mode?: "replace" | "upsert" | "insert_only";
      fileName?: string;
    };
    const raw = Array.isArray(body.rows) ? body.rows : [];
    const rows = raw.filter(
      (p) => (p.name ?? "").trim().length > 0,
    ) as ProjectRecord[];
    const mode = body.mode ?? "upsert";
    const fileName = String(body.fileName ?? "import.xlsx");
    if (!rows.length) {
      return NextResponse.json(
        { error: "Nenhuma linha para importar (é necessário nome em cada linha)." },
        { status: 400 },
      );
    }
    const r = await runProjectImport({
      rows,
      mode,
      userId: auth.userId,
      fileName,
    });
    if (!r.ok) {
      console.error("[api/import/excel] runProjectImport", r.error);
      return NextResponse.json(
        { error: "Erro ao importar. Tente de novo." },
        { status: 500 },
      );
    }
    revalidatePath("/dashboard");
    revalidatePath("/settings");
    revalidateTag("omni-portfolio-projects");
    return NextResponse.json({
      ok: true,
      imported: r.imported,
      ...(r.logWarning ? { logWarning: r.logWarning } : {}),
    });
  }

  const form = await request.formData();
  const file = form.get("file");
  if (!(file instanceof Blob)) {
    return NextResponse.json({ error: "Arquivo ausente." }, { status: 400 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json(
      { error: "Arquivo acima do limite (10 MB)." },
      { status: 400 },
    );
  }
  const name = "name" in file ? String((file as File).name) : "upload.xlsx";
  if (!name.toLowerCase().endsWith(".xlsx")) {
    return NextResponse.json(
      { error: "Apenas arquivos .xlsx são aceitos." },
      { status: 400 },
    );
  }

  const buf = await file.arrayBuffer();
  let matrix;
  try {
    const parsed = parseWorkbookToMatrix(buf, getExcelSheetName());
    matrix = parsed.matrix;
  } catch (e) {
    console.error("[api/import/excel] parse", e);
    return NextResponse.json(
      {
        error:
          "Não foi possível ler a planilha. Verifique se o ficheiro é um .xlsx válido.",
      },
      { status: 400 },
    );
  }

  const allMatrixRows = matrixToPortfolioRows(matrix);
  const rows = allMatrixRows.filter(isPortfolioRowWithNameInNameColumn);
  const projects = mapRowsToProjects(rows);
  const issues = validateProjectRows(projects);
  const summary = summarizeDates(projects);

  return NextResponse.json({
    projects,
    issues,
    summary,
    fileName: name,
  });
}
