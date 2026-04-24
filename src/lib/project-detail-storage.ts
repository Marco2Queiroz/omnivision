import type { ProjectRecord } from "@/types/project";

export const PROJECT_EXTRA_FIELD_KEYS = [
  "attachment",
  "client",
  "milestone",
  "phase",
  "tags",
  "link",
  "kpi",
  "risk",
  "priority",
  "team",
  "resources",
  "neighborhood",
] as const;

export type ProjectExtraKey = (typeof PROJECT_EXTRA_FIELD_KEYS)[number];

/** JSON persistido em `detail_json` (e legível no Appwrite). */
export type StoredProjectDetail = {
  description: string;
  updates: string;
} & Partial<Record<ProjectExtraKey, string>>;

export function hasExtendedImportFields(p: ProjectRecord): boolean {
  for (const k of PROJECT_EXTRA_FIELD_KEYS) {
    const v = p[k];
    if (v != null && String(v).trim() !== "") return true;
  }
  return false;
}

/** Serializa descrição, observações e campos extras do novo Excel para `detail_json`. */
export function serializeProjectDetailJson(p: ProjectRecord): string {
  const o: StoredProjectDetail = {
    description: p.description ?? "",
    updates: p.updates ?? "",
  };
  for (const k of PROJECT_EXTRA_FIELD_KEYS) {
    const v = p[k];
    if (v != null && String(v).trim() !== "") {
      o[k] = String(v).trim();
    }
  }
  return JSON.stringify(o);
}

/** Interpreta `detail_json` gravado no Appwrite → campos opcionais do registro. */
export function parseStoredProjectDetail(
  packed: string,
): Partial<ProjectRecord> | null {
  if (!packed.trim()) return null;
  try {
    const o = JSON.parse(packed) as Record<string, unknown>;
    const out: Partial<ProjectRecord> = {};
    if (typeof o.description === "string") out.description = o.description;
    if (typeof o.updates === "string") out.updates = o.updates;
    for (const k of PROJECT_EXTRA_FIELD_KEYS) {
      const v = o[k];
      if (typeof v === "string" && v.trim() !== "") {
        (out as Record<string, string>)[k] = v.trim();
      }
    }
    return out;
  } catch {
    return null;
  }
}
