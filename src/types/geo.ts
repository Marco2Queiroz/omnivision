export type GeoPlanStatus = "aberto" | "em_andamento" | "concluido" | "cancelado";

export type PlanoCriseGeo = {
  id: string;
  titulo: string;
  descricao: string | null;
  status: GeoPlanStatus;
  owner_name: string | null;
  created_at: string;
  updated_at: string;
};
