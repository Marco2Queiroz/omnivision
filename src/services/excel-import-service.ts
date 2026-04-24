import { getAccessDatabaseId } from "@/lib/access-service";
import { getServerDatabases } from "@/lib/appwrite-server";
import {
  hasExtendedImportFields,
  serializeProjectDetailJson,
} from "@/lib/project-detail-storage";
import {
  getProjectsCollectionId,
  mapAppwriteProjectDocument,
} from "@/lib/project-appwrite";
import { ensureProjectsCollectionReady } from "@/lib/projects-schema";
import { createImportLog, deleteAllImportLogs } from "@/services/import-logs-service";
import type { ProjectRecord } from "@/types/project";
import { ID, Permission, Query, Role } from "node-appwrite";

export type ImportMode = "replace" | "upsert" | "insert_only";

export type RunProjectImportResult =
  | { ok: true; imported: number; logWarning?: string }
  | { ok: false; error: string };

/** Campos numéricos + texto comuns a ambos os formatos de schema. */
function projectToDocDataBase(p: ProjectRecord) {
  return {
    name: p.name,
    category: p.category,
    area: p.area,
    sponsor: p.sponsor,
    status: p.status,
    startDate: p.startDate ?? "",
    endDate: p.endDate ?? "",
    plannedHours: p.plannedHours,
    actualHours: p.actualHours,
    capex: p.capex,
    portfolio_segment: p.portfolioSegment?.trim() ?? "",
  };
}

/** Schema legado: `description` + `updates` (coleções criadas antes do campo único). */
function projectToDocDataLegacy(p: ProjectRecord) {
  return {
    ...projectToDocDataBase(p),
    description: p.description ?? "",
    updates: p.updates ?? "",
  };
}

/** Schema compacto: um JSON em `detail_json` (descrição, observações e campos extras do Excel). */
function projectToDocDataJson(p: ProjectRecord) {
  return {
    ...projectToDocDataBase(p),
    detail_json: serializeProjectDetailJson(p),
  };
}

function isProjectSchemaMismatch(e: unknown): boolean {
  const m = e instanceof Error ? e.message : String(e);
  return (
    /unknown attribute|invalid document structure|attribute.*not found|missing attribute/i.test(
      m,
    ) || m.includes("Invalid document structure")
  );
}

function normName(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

async function deleteAllProjects(): Promise<void> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();
  if (!databases || !databaseId) {
    throw new Error("Appwrite não configurado.");
  }
  for (;;) {
    const res = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: [Query.limit(100)],
    });
    if (res.documents.length === 0) return;
    for (const doc of res.documents) {
      await databases.deleteDocument({
        databaseId,
        collectionId,
        documentId: doc.$id,
      });
    }
  }
}

async function listAllProjects(): Promise<ProjectRecord[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();
  if (!databases || !databaseId) {
    throw new Error("Appwrite não configurado.");
  }
  const res = await databases.listDocuments({
    databaseId,
    collectionId,
    queries: [Query.limit(500)],
  });
  return res.documents.map((doc) =>
    mapAppwriteProjectDocument(doc as unknown as Record<string, unknown>),
  );
}

async function createProject(
  p: ProjectRecord,
  options?: { preferDetailJson?: boolean },
): Promise<void> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();
  if (!databases || !databaseId) throw new Error("Appwrite não configurado.");
  const common = {
    databaseId,
    collectionId,
    documentId: ID.unique(),
    permissions: [
      Permission.read(Role.users()),
      Permission.update(Role.users()),
      Permission.delete(Role.users()),
    ],
  };
  if (options?.preferDetailJson) {
    await databases.createDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
    return;
  }
  if (hasExtendedImportFields(p)) {
    await databases.createDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
    return;
  }

  try {
    await databases.createDocument({
      ...common,
      data: projectToDocDataLegacy(p),
    });
  } catch (e) {
    if (!isProjectSchemaMismatch(e)) throw e;
    await databases.createDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
  }
}

async function updateProject(
  documentId: string,
  p: ProjectRecord,
  options?: { preferDetailJson?: boolean },
): Promise<void> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();
  if (!databases || !databaseId) throw new Error("Appwrite não configurado.");
  const common = { databaseId, collectionId, documentId };
  if (options?.preferDetailJson) {
    await databases.updateDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
    return;
  }
  if (hasExtendedImportFields(p)) {
    await databases.updateDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
    return;
  }

  try {
    await databases.updateDocument({
      ...common,
      data: projectToDocDataLegacy(p),
    });
  } catch (e) {
    if (!isProjectSchemaMismatch(e)) throw e;
    await databases.updateDocument({
      ...common,
      data: projectToDocDataJson(p),
    });
  }
}

/**
 * Importa projetos para o Appwrite conforme o modo. Exige API key e coleção `projects`.
 */
export async function runProjectImport(input: {
  rows: ProjectRecord[];
  mode: ImportMode;
  userId: string;
  fileName: string;
}): Promise<RunProjectImportResult> {
  const { rows, mode, userId, fileName } = input;
  try {
    const schema = await ensureProjectsCollectionReady();
    if (!schema.ok) {
      return { ok: false, error: schema.message };
    }

    const preferDetailJson = schema.detailJsonReady === true;
    const importOpts = { preferDetailJson };

    let imported = 0;

    if (mode === "replace") {
      await deleteAllProjects();
      for (const p of rows) {
        await createProject({ ...p, id: p.id }, importOpts);
        imported += 1;
      }
    } else if (mode === "upsert") {
      const existing = await listAllProjects();
      const byName = new Map<string, { id: string }>();
      for (const e of existing) {
        byName.set(normName(e.name), { id: e.id });
      }
      for (const p of rows) {
        const key = normName(p.name);
        const hit = byName.get(key);
        if (hit) {
          await updateProject(hit.id, { ...p, id: hit.id }, importOpts);
        } else {
          await createProject({ ...p, id: p.id }, importOpts);
        }
        imported += 1;
      }
    } else {
      const existing = await listAllProjects();
      const names = new Set(existing.map((e) => normName(e.name)));
      for (const p of rows) {
        const key = normName(p.name);
        if (names.has(key)) continue;
        await createProject({ ...p, id: p.id }, importOpts);
        imported += 1;
      }
    }

    const logResult = await createImportLog({
      user_id: userId,
      file_name: fileName,
      import_type: mode,
      rows_imported: imported,
    });

    if (!logResult.ok) {
      return {
        ok: true,
        imported,
        logWarning: logResult.error,
      };
    }

    return { ok: true, imported };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/**
 * Zera a base de portfólio (projetos) e o histórico de importações Excel
 * no Appwrite, para permitir subir uma nova carga do zero. Não altera
 * usuários, acessos, parâmetros do app nem configuração de status.
 */
export async function clearPortfolioDataForNewExcelLoad(): Promise<
  | { ok: true; importLogsCleared: true }
  | { ok: true; importLogsCleared: false; importLogsError: string }
  | { ok: false; error: string }
> {
  try {
    const databases = getServerDatabases();
    const databaseId = getAccessDatabaseId();
    if (!databases || !databaseId) {
      return { ok: false, error: "Appwrite não configurado." };
    }

    await deleteAllProjects();
    try {
      await deleteAllImportLogs();
      return { ok: true, importLogsCleared: true };
    } catch (e) {
      const importLogsError =
        e instanceof Error ? e.message : String(e);
      return {
        ok: true,
        importLogsCleared: false,
        importLogsError,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
