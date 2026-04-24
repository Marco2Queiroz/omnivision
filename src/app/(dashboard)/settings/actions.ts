"use server";

import { getSettingsAuthContext } from "@/lib/settings-access";
import { ensureProjectsCollectionReady } from "@/lib/projects-schema";
import {
  createStatusConfig,
  deleteStatusConfig,
  getAppSettings,
  saveAppSettings,
  updateStatusConfig,
} from "@/services/settings-service";
import { revalidatePath } from "next/cache";

export async function actionSaveAppSettings(formData: FormData) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const hour = Number(formData.get("hour_value"));
  const dateFormat = String(formData.get("date_format") ?? "dd/MM/yyyy");
  if (!Number.isFinite(hour) || hour <= 0) {
    return { ok: false as const, error: "Valor hora inválido." };
  }
  const current = await getAppSettings();
  const r = await saveAppSettings({
    hour_value: hour,
    ui_preferences: {
      ...current.ui_preferences,
      dateFormat,
    },
  });
  if (!r.ok) return { ok: false as const, error: r.error };
  revalidatePath("/dashboard");
  revalidatePath("/settings");
  return { ok: true as const };
}

export async function actionCreateStatus(formData: FormData) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#64748b").trim();
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_final = formData.get("is_final") === "on";
  if (!name) return { ok: false as const, error: "Nome obrigatório." };
  const r = await createStatusConfig({ name, color, sort_order, is_final });
  if (!r.ok) return { ok: false as const, error: r.error };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function actionUpdateStatus(
  documentId: string,
  formData: FormData,
) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const name = String(formData.get("name") ?? "").trim();
  const color = String(formData.get("color") ?? "#64748b").trim();
  const sort_order = Number(formData.get("sort_order") ?? 0);
  const is_final = formData.get("is_final") === "on";
  if (!name) return { ok: false as const, error: "Nome obrigatório." };
  const r = await updateStatusConfig(documentId, {
    name,
    color,
    sort_order,
    is_final,
  });
  if (!r.ok) return { ok: false as const, error: r.error };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

export async function actionDeleteStatus(documentId: string) {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, error: "Sem permissão." };
  }
  const r = await deleteStatusConfig(documentId);
  if (!r.ok) return { ok: false as const, error: r.error };
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return { ok: true as const };
}

/** Garante atributos da coleção projects (ex.: detail_json) — mesmo efeito do botão em Acessos + import. */
export async function actionEnsureProjectsSchema() {
  const ctx = await getSettingsAuthContext();
  if (!ctx.allowed) {
    return { ok: false as const, message: "Sem permissão." };
  }
  const r = await ensureProjectsCollectionReady();
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  return r;
}
