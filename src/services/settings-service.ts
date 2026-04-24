import { getAccessDatabaseId } from "@/lib/access-service";
import { getServerDatabases } from "@/lib/appwrite-server";
import type { UiPreferences } from "@/domain/settings/types";
import { ID, Permission, Query, Role } from "node-appwrite";
import { revalidateTag, unstable_cache } from "next/cache";

const DOC_ID = process.env.APPWRITE_APP_SETTINGS_DOC_ID?.trim() || "default";

export function getAppSettingsCollectionId(): string {
  return process.env.APPWRITE_APP_SETTINGS_COLLECTION_ID?.trim() || "app_settings";
}

const DEFAULT_HOUR = (() => {
  const n = Number(process.env.NEXT_PUBLIC_DEFAULT_HOUR_VALUE);
  return Number.isFinite(n) && n > 0 ? n : 150;
})();

function defaultUiPreferences(): UiPreferences {
  return {
    dateFormat: "dd/MM/yyyy",
    pageSize: 25,
  };
}

function parseUiPreferences(raw: string | undefined): UiPreferences {
  if (!raw?.trim()) return defaultUiPreferences();
  try {
    const j = JSON.parse(raw) as UiPreferences;
    return {
      ...defaultUiPreferences(),
      ...j,
    };
  } catch {
    return defaultUiPreferences();
  }
}

export async function getAppSettings(): Promise<{
  hour_value: number;
  capex_formula: "actual_hours";
  ui_preferences: UiPreferences;
}> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAppSettingsCollectionId();

  if (!databases || !databaseId) {
    return {
      hour_value: DEFAULT_HOUR,
      capex_formula: "actual_hours",
      ui_preferences: defaultUiPreferences(),
    };
  }

  try {
    const doc = await databases.getDocument({
      databaseId,
      collectionId,
      documentId: DOC_ID,
    });
    const d = doc as unknown as Record<string, unknown>;
    const hv = Number(d.hour_value);
    return {
      hour_value:
        Number.isFinite(hv) && hv > 0 ? hv : DEFAULT_HOUR,
      capex_formula: "actual_hours",
      ui_preferences: parseUiPreferences(String(d.ui_preferences ?? "")),
    };
  } catch {
    return {
      hour_value: DEFAULT_HOUR,
      capex_formula: "actual_hours",
      ui_preferences: defaultUiPreferences(),
    };
  }
}

/** Cache curto para trocas de aba no dashboard (tela Configurações usa `getAppSettings` direto). */
export const getAppSettingsForDashboard = unstable_cache(
  async () => getAppSettings(),
  ["omnivision-app-settings-dashboard"],
  { revalidate: 45, tags: ["omni-app-settings"] },
);

export async function saveAppSettings(input: {
  hour_value: number;
  ui_preferences: UiPreferences;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAppSettingsCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }

  const hour = Math.max(0.01, input.hour_value);
  const data = {
    hour_value: hour,
    capex_formula: "actual_hours",
    ui_preferences: JSON.stringify(input.ui_preferences),
  };

  try {
    await databases.updateDocument({
      databaseId,
      collectionId,
      documentId: DOC_ID,
      data,
    });
    revalidateTag("omni-app-settings");
    return { ok: true };
  } catch {
    try {
      await databases.createDocument({
        databaseId,
        collectionId,
        documentId: DOC_ID,
        data,
        permissions: [
          Permission.read(Role.users()),
          Permission.update(Role.users()),
        ],
      });
      revalidateTag("omni-app-settings");
      return { ok: true };
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return { ok: false, error: msg };
    }
  }
}

export type StatusConfigRow = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  is_final: boolean;
};

export function getStatusConfigCollectionId(): string {
  return process.env.APPWRITE_STATUS_CONFIG_COLLECTION_ID?.trim() || "status_config";
}

export async function listStatusConfigs(): Promise<StatusConfigRow[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getStatusConfigCollectionId();
  if (!databases || !databaseId) return [];

  try {
    const { documents } = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: [Query.orderAsc("sort_order"), Query.limit(100)],
    });
    return documents.map((d) => {
      const x = d as unknown as Record<string, unknown>;
      return {
        id: String(x.$id ?? ""),
        name: String(x.name ?? ""),
        color: String(x.color ?? "#64748b"),
        sort_order: Number(x.sort_order ?? 0),
        is_final: Boolean(x.is_final ?? false),
      };
    });
  } catch {
    return [];
  }
}

export async function createStatusConfig(input: Omit<StatusConfigRow, "id">): Promise<
  { ok: true; id: string } | { ok: false; error: string }
> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getStatusConfigCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }
  try {
    const doc = await databases.createDocument({
      databaseId,
      collectionId,
      documentId: ID.unique(),
      data: {
        name: input.name,
        color: input.color,
        sort_order: input.sort_order,
        is_final: input.is_final,
      },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    });
    return { ok: true, id: doc.$id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function updateStatusConfig(
  documentId: string,
  input: Omit<StatusConfigRow, "id">,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getStatusConfigCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }
  try {
    await databases.updateDocument({
      databaseId,
      collectionId,
      documentId,
      data: {
        name: input.name,
        color: input.color,
        sort_order: input.sort_order,
        is_final: input.is_final,
      },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function deleteStatusConfig(
  documentId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getStatusConfigCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }
  try {
    await databases.deleteDocument({
      databaseId,
      collectionId,
      documentId,
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
