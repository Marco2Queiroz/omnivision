export type ProjectStatus =
  | "backlog"
  | "em_andamento"
  | "em_negociacao"
  | "entregue"
  | "operacao_assistida"
  | string;

export type ProjectRecord = {
  id: string;
  name: string;
  /**
   * Coluna "Time" do Excel: valor alinhado ao rótulo da aba (ex.: "Projetos")
   * para roteamento; **não** mostrar como coluna na tabela (uso interno).
   * Se não houver coluna "Área" preenchida, o valor de Time reforça o campo
   * `area` exibido na grid.
   */
  portfolioSegment?: string;
  category: string;
  area: string;
  sponsor: string;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  plannedHours: number;
  actualHours: number;
  capex: number;
  description: string;
  updates: string;
  /** Novo padrão Excel — persistidos em `detail_json` no Appwrite */
  attachment?: string;
  client?: string;
  milestone?: string;
  phase?: string;
  tags?: string;
  link?: string;
  kpi?: string;
  risk?: string;
  priority?: string;
  team?: string;
  resources?: string;
  neighborhood?: string;
};

export type ProjectItemRecord = {
  id: string;
  projectId: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  startDate: string | null;
  endDate: string | null;
  estimatedHours: number;
};
