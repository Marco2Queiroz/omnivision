import { checkApiRateLimit, getClientIp } from "@/lib/api-rate-limit";
import { getSettingsAuthContext } from "@/lib/settings-access";
import { clearPortfolioDataForNewExcelLoad } from "@/services/excel-import-service";
import { revalidatePath, revalidateTag } from "next/cache";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 120;

export async function POST(request: Request) {
  const ip = getClientIp(request.headers);
  const lim = checkApiRateLimit(ip, "post-clear-portfolio");
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

  const r = await clearPortfolioDataForNewExcelLoad();
  if (!r.ok) {
    console.error("[api/clear-portfolio]", r.error);
    return NextResponse.json({ error: "Erro interno." }, { status: 500 });
  }

  revalidatePath("/dashboard");
  revalidatePath("/settings");
  revalidateTag("omni-portfolio-projects");

  if (!r.importLogsCleared) {
    if (r.importLogsError) {
      console.warn("[api/clear-portfolio] import log", r.importLogsError);
    }
    return NextResponse.json({
      ok: true,
      importLogsCleared: false,
      warning:
        "Projetos removidos; o log de importações não pôde ser limpo. Consulte o suporte se necessário.",
    });
  }

  return NextResponse.json({ ok: true, importLogsCleared: true });
}
