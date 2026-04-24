import { getAccessDatabaseId } from "@/lib/access-service";
import { getServerDatabases } from "@/lib/appwrite-server";
import { ID, Permission, Query, Role } from "node-appwrite";

export type ImportLogRow = {
  id: string;
  user_id: string;
  file_name: string;
  import_type: "replace" | "upsert" | "insert_only";
  created_at: string;
  rows_imported: number;
};

export function getImportLogsCollectionId(): string {
  return process.env.APPWRITE_IMPORT_LOGS_COLLECTION_ID?.trim() || "import_logs";
}

export async function listImportLogs(limit = 50): Promise<ImportLogRow[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getImportLogsCollectionId();
  if (!databases || !databaseId) return [];

  try {
    const { documents } = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: [Query.orderDesc("$createdAt"), Query.limit(limit)],
    });
    return documents.map((d) => {
      const x = d as unknown as Record<string, unknown>;
      return {
        id: String(x.$id ?? ""),
        user_id: String(x.user_id ?? ""),
        file_name: String(x.file_name ?? ""),
        import_type: String(x.import_type ?? "upsert") as ImportLogRow["import_type"],
        created_at: String(x.$createdAt ?? ""),
        rows_imported: Number(x.rows_imported ?? 0),
      };
    });
  } catch {
    return [];
  }
}

/**
 * Remove todos os documentos da coleção de log de importações (API server).
 * Usa paginação em lotes para bases grandes.
 */
export async function deleteAllImportLogs(): Promise<void> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getImportLogsCollectionId();
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

export async function createImportLog(input: {
  user_id: string;
  file_name: string;
  import_type: ImportLogRow["import_type"];
  rows_imported: number;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getImportLogsCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }
  try {
    await databases.createDocument({
      databaseId,
      collectionId,
      documentId: ID.unique(),
      data: {
        user_id: input.user_id,
        file_name: input.file_name,
        import_type: input.import_type,
        rows_imported: input.rows_imported,
      },
      /* Permissões de documento: read/update (create não se aplica a documentos no Appwrite). */
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
      ],
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}
