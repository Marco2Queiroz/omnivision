/**
 * Visão de portefólio: a lista carregada no servidor (API key) é a **mesma** para
 * todos os utilizadores com sessão — o isolamento é a nível de organização (um
 * projecto Appwrite) e regras do painel. Linhas sensíveis multi-inquilino
 * requerem filtragem no documento ou regras Appwrite por atributo.
 */
import {
  fetchAllProjectsUnfiltered,
  isProjectsCollectionConfigured,
} from "@/lib/project-appwrite";
import { filterProjectsByTab } from "@/lib/project-tab-filters";
import type { DashboardTabId } from "@/lib/dashboard-tabs";
import { isDashboardTabId } from "@/lib/dashboard-tabs";
import type { ProjectRecord } from "@/types/project";
import { unstable_cache } from "next/cache";

function resolveTab(tab?: string): DashboardTabId {
  if (tab && isDashboardTabId(tab)) return tab;
  return "todos";
}

async function loadAllProjectsForPortfolio(): Promise<ProjectRecord[]> {
  if (isProjectsCollectionConfigured()) {
    try {
      return await fetchAllProjectsUnfiltered();
    } catch (err) {
      /* Não usar mock aqui: mascararia falha de API/permissão e pareceria “sumir” o import. */
      console.error("[listProjects] Falha ao ler projetos no Appwrite:", err);
      return [];
    }
  }

  const { MOCK_PROJECTS } = await import("@/lib/mock-projects");
  return MOCK_PROJECTS;
}

/** Cache compartilhado entre abas do dashboard (evita novo round-trip Appwrite a cada clique). */
const getCachedPortfolioProjects = unstable_cache(
  loadAllProjectsForPortfolio,
  ["omnivision-portfolio-all-projects"],
  { revalidate: 30, tags: ["omni-portfolio-projects"] },
);

/**
 * Lista projetos: Appwrite quando configurado; senão mock.
 * Filtro por aba em memória sobre a mesma lista em cache.
 */
export async function listProjects(filter?: {
  tab?: string;
}): Promise<ProjectRecord[]> {
  const tab = resolveTab(filter?.tab);
  const all = await getCachedPortfolioProjects();
  return filterProjectsByTab(all, tab);
}

export async function listProjectItems(projectId: string) {
  void projectId;
  return [] as {
    id: string;
    title: string;
    description: string;
    status: string;
  }[];
}
