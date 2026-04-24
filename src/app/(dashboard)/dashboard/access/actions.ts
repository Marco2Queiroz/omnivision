"use server";

import {
  createUserWithProfile,
  initAccessCollection,
  isAccessLayerConfigured,
  seedTestUserLocal,
  updateProfileRole,
} from "@/lib/access-service";
import { getRequestHost } from "@/lib/auth-session-server";
import { shouldSkipAuthServer } from "@/lib/auth-policy";
import { getSettingsAuthContext } from "@/lib/settings-access";
import { ensureProjectsCollectionReady } from "@/lib/projects-schema";
import type { AccessRole } from "@/types/access";
import { parseAccessRole } from "@/types/access";
import { revalidatePath } from "next/cache";

export async function actionCreateAccessUser(formData: FormData) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "");
  const role = parseAccessRole(String(formData.get("role") ?? ""));

  const r = await createUserWithProfile({ email, password, name, role });
  revalidatePath("/dashboard/access");
  return r;
}

export async function actionUpdateRole(documentId: string, role: AccessRole) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const r = await updateProfileRole(documentId, role);
  revalidatePath("/dashboard/access");
  return r;
}

export async function actionInitAccessSchema() {
  const host = await getRequestHost();
  if (!shouldSkipAuthServer(host) && isAccessLayerConfigured()) {
    const ctx = await getSettingsAuthContext();
    if (!ctx.allowed) {
      return { ok: false, message: "Sem permissão." };
    }
  }
  const r1 = await initAccessCollection();
  const r2 = await ensureProjectsCollectionReady();
  revalidatePath("/dashboard/access");
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return {
    ok: r1.ok && r2.ok,
    message: [r1.message, r2.message].filter(Boolean).join(" · "),
  };
}

export async function actionSeedTestUser(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false, error: "Sem permissão." };
  }
  const r = await seedTestUserLocal();
  revalidatePath("/dashboard/access");
  return r;
}
