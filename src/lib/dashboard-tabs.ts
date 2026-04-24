/** Abas do header executivo (VAMOS) — slugs de URL estáveis */
export const DASHBOARD_TABS = [
  { id: "todos", label: "Dashboard", path: "/dashboard/todos" },
  { id: "operacional", label: "Operacional", path: "/dashboard/operacional" },
  { id: "tatica", label: "Tática", path: "/dashboard/tatica" },
  { id: "estrategica", label: "Estratégica", path: "/dashboard/estrategica" },
  { id: "projetos", label: "Projetos", path: "/dashboard/projetos" },
  {
    id: "seguranca",
    label: "Segurança da Informação",
    path: "/dashboard/seguranca",
  },
  { id: "governanca", label: "Governança", path: "/dashboard/governanca" },
  { id: "dados", label: "IA | RPA | DADOS", path: "/dashboard/dados" },
  {
    id: "field-service",
    label: "Field Service",
    path: "/dashboard/field-service",
  },
] as const;

export type DashboardTabId = (typeof DASHBOARD_TABS)[number]["id"];

export function isDashboardTabId(s: string): s is DashboardTabId {
  return DASHBOARD_TABS.some((t) => t.id === s);
}
