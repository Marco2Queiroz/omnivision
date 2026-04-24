/** Níveis atuais (3). Valores em documentos legados são mapeados em `parseAccessRole`. */
export const ACCESS_ROLES = ["master", "executivo", "leitor"] as const;

export type AccessRole = (typeof ACCESS_ROLES)[number];

export const ACCESS_ROLE_LABELS: Record<AccessRole, string> = {
  master: "Master — acesso completo ao sistema",
  executivo:
    "Executivo — visão geral; personalizar colunas, título e linha de filtros",
  leitor: "Leitor — somente visão geral (sem personalização)",
};

/** Mapeia rótulos armazenados no Appwrite (legado) para o nível actual. */
const LEGACY_TO_ROLE: Record<string, AccessRole> = {
  admin: "master",
  master: "master",
  gestor: "executivo",
  executivo: "executivo",
  gerencia: "executivo",
  leitor: "leitor",
  operacional: "leitor",
};

export type AccessProfileDoc = {
  id: string;
  user_id: string;
  email: string;
  name: string;
  role: AccessRole;
  active: boolean;
  area: string;
  /** Slugs de abas permitidas (JSON no Appwrite ou string[]) */
  allowed_tabs: string[];
  auth_provider: "email" | "sso_saml" | string;
  created_at: string;
  updated_at: string;
};

export function parseAccessRole(value: string | undefined | null): AccessRole {
  const v = String(value ?? "").toLowerCase().trim();
  if (v === "master" || v === "executivo" || v === "leitor") return v;
  return LEGACY_TO_ROLE[v] ?? "leitor";
}

export function isAdminRole(role: AccessRole): boolean {
  return role === "master";
}

/** Consola de configurações, import e gestão de acesso: apenas Master. */
export function canAccessSettingsConsole(role: AccessRole): boolean {
  return role === "master";
}

/** Reordenar colunas, título, visibilidade de colunas e linha de filtros: Master e Executivo. */
export function canCustomizeDashboardUi(role: AccessRole): boolean {
  return role === "master" || role === "executivo";
}

/** Abas do portfólio (além de «Todos» / visão geral). */
export function canViewFullPortfolioNav(role: AccessRole): boolean {
  return role === "master";
}

export function parseAllowedTabs(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x));
  }
  if (typeof raw === "string" && raw.trim()) {
    try {
      const j = JSON.parse(raw) as unknown;
      if (Array.isArray(j)) return j.map((x) => String(x));
    } catch {
      return raw.split(",").map((s) => s.trim()).filter(Boolean);
    }
  }
  return [];
}
