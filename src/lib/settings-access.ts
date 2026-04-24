import {
  getAccessProfileByUserId,
  isAccessLayerConfigured,
} from "@/lib/access-service";
import {
  getRequestHost,
  getSessionUser,
} from "@/lib/auth-session-server";
import { shouldSkipAuthServer } from "@/lib/auth-policy";
import { canAccessSettingsConsole } from "@/types/access";
import { redirect } from "next/navigation";

export type SettingsAuthResult =
  | { allowed: true; userId: string; devBypass: boolean }
  | { allowed: false; reason: "unauthenticated" | "forbidden" };

/**
 * Contexto de auth para API routes (sem redirect).
 */
export async function getSettingsAuthContext(): Promise<SettingsAuthResult> {
  const host = await getRequestHost();
  if (shouldSkipAuthServer(host)) {
    return { allowed: true, userId: "dev-bypass", devBypass: true };
  }

  const user = await getSessionUser();
  if (!user) {
    return { allowed: false, reason: "unauthenticated" };
  }

  if (!isAccessLayerConfigured()) {
    return { allowed: false, reason: "forbidden" };
  }

  const profile = await getAccessProfileByUserId(user.$id);
  if (!profile || !canAccessSettingsConsole(profile.role)) {
    return { allowed: false, reason: "forbidden" };
  }

  return { allowed: true, userId: user.$id, devBypass: false };
}

/**
 * Garante acesso à Admin Console: em ambientes com auth ignorada (dev/localhost),
 * permite entrada para desenvolvimento. Caso contrário, exige sessão + perfil Master.
 */
export async function assertSettingsAccess(): Promise<void> {
  const host = await getRequestHost();
  if (shouldSkipAuthServer(host)) {
    return;
  }

  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    if (ctx.reason === "unauthenticated") {
      redirect("/login?next=/settings");
    }
    redirect("/dashboard/todos");
  }
}
