import type { DashboardTabId } from "@/lib/dashboard-tabs";
import { getAccessDatabaseId } from "@/lib/access-service";
import { filterProjectsByTab } from "@/lib/project-tab-filters";
import { getServerDatabases } from "@/lib/appwrite-server";
import {
  PROJECT_EXTRA_FIELD_KEYS,
  parseStoredProjectDetail,
} from "@/lib/project-detail-storage";
import type { ProjectRecord } from "@/types/project";
import { Query } from "node-appwrite";

const DEFAULT_COLLECTION = "projects";
const FETCH_LIMIT = 500;

export function getProjectsCollectionId(): string {
  const id = process.env.APPWRITE_PROJECTS_COLLECTION_ID?.trim();
  return id || DEFAULT_COLLECTION;
}

export function isProjectsCollectionConfigured(): boolean {
  return Boolean(
    process.env.APPWRITE_API_KEY?.trim() &&
      getAccessDatabaseId() &&
      getProjectsCollectionId(),
  );
}

/**
 * Mapeia documento Appwrite → ProjectRecord.
 * Atributos: name, category, area, sponsor, status, startDate, endDate,
 * plannedHours, actualHours, capex; texto longo em `detail_json` (JSON com
 * description/updates) ou atributos legados `description` / `updates`.
 */
export function mapAppwriteProjectDocument(
  doc: Record<string, unknown>,
): ProjectRecord {
  const str = (v: unknown): string =>
    typeof v === "string" ? v : v == null ? "" : String(v);
  const num = (v: unknown): number => {
    if (typeof v === "number" && !Number.isNaN(v)) return v;
    if (typeof v === "string" && v.trim() !== "") {
      const n = Number(v);
      return Number.isNaN(n) ? 0 : n;
    }
    return 0;
  };

  const id =
    typeof doc.$id === "string"
      ? doc.$id
      : doc.$id != null
        ? String(doc.$id)
        : "";

  const packed = str(doc.detail_json);
  const fromDetail = packed.trim()
    ? parseStoredProjectDetail(packed)
    : null;

  const description =
    fromDetail?.description ?? str(doc.description);
  const updates = fromDetail?.updates ?? str(doc.updates);

  const base: ProjectRecord = {
    id,
    name: str(doc.name),
    portfolioSegment: str(doc.portfolio_segment).trim() || undefined,
    category: str(doc.category),
    area: str(doc.area),
    sponsor: str(doc.sponsor),
    status: str(doc.status) || "backlog",
    startDate: str(doc.startDate) || null,
    endDate: str(doc.endDate) || null,
    plannedHours: num(doc.plannedHours),
    actualHours: num(doc.actualHours),
    capex: num(doc.capex),
    description,
    updates,
  };

  if (!fromDetail) return base;

  const out: ProjectRecord = { ...base };
  const extraTarget = out as unknown as Record<string, string>;
  for (const k of PROJECT_EXTRA_FIELD_KEYS) {
    const v = fromDetail[k];
    if (typeof v === "string" && v.trim() !== "") {
      extraTarget[k] = v.trim();
    }
  }
  return out;
}

/** Queries otimizadas quando há correspondência exata no banco. */
function buildQueriesForTab(tab: DashboardTabId): string[] {
  switch (tab) {
    case "todos":
      return [
        Query.orderDesc("$createdAt"),
        Query.limit(FETCH_LIMIT),
      ];
    case "dados":
      return [
        Query.equal("area", "Dados"),
        Query.orderDesc("$createdAt"),
        Query.limit(FETCH_LIMIT),
      ];
    case "field-service":
      return [
        Query.equal("area", "Field Service"),
        Query.orderDesc("$createdAt"),
        Query.limit(FETCH_LIMIT),
      ];
    case "projetos":
      return [
        Query.startsWith("category", "Projetos"),
        Query.orderDesc("$createdAt"),
        Query.limit(FETCH_LIMIT),
      ];
    /** Áreas variam no texto — busca ampla e filtro em `filterProjectsByTab`. */
    case "seguranca":
    case "governanca":
    default:
      return [Query.orderDesc("$createdAt"), Query.limit(FETCH_LIMIT)];
  }
}

/**
 * Lista projetos no Appwrite (API key no servidor) e aplica filtro da aba.
 */
export async function fetchProjectsForTab(
  tab: DashboardTabId,
): Promise<ProjectRecord[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();

  if (!databases || !databaseId) {
    throw new Error("Appwrite Databases não configurado (API key / database).");
  }

  const queries = buildQueriesForTab(tab);

  const res = await databases.listDocuments({
    databaseId,
    collectionId,
    queries,
  });

  const mapped = res.documents.map((d) =>
    mapAppwriteProjectDocument(d as unknown as Record<string, unknown>),
  );

  return filterProjectsByTab(mapped, tab);
}

/**
 * Uma única leitura (até FETCH_LIMIT) para todo o portfólio; filtros por aba
 * aplicados em memória — permite cache compartilhado entre trocas de aba.
 */
export async function fetchAllProjectsUnfiltered(): Promise<ProjectRecord[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getProjectsCollectionId();

  if (!databases || !databaseId) {
    throw new Error("Appwrite Databases não configurado (API key / database).");
  }

  const res = await databases.listDocuments({
    databaseId,
    collectionId,
    queries: [Query.orderDesc("$createdAt"), Query.limit(FETCH_LIMIT)],
  });

  return res.documents.map((d) =>
    mapAppwriteProjectDocument(d as unknown as Record<string, unknown>),
  );
}
