export type AppRole = "Diretor" | "Gestor" | "Operacional";

export type Profile = {
  id: string;
  full_name: string | null;
  role: AppRole;
  updated_at: string | null;
};
