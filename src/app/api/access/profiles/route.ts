import { listAccessProfiles } from "@/lib/access-service";
import { getSettingsAuthContext } from "@/lib/settings-access";
import { checkApiRateLimit, getClientIp } from "@/lib/api-rate-limit";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const ip = getClientIp(request.headers);
  const lim = checkApiRateLimit(ip, "get-access-profiles");
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
  try {
    const profiles = await listAccessProfiles();
    return NextResponse.json(profiles);
  } catch (e) {
    console.error("[api/access/profiles]", e);
    return NextResponse.json(
      { error: "Erro interno." },
      { status: 500 },
    );
  }
}
