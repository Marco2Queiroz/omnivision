import { redirect } from "next/navigation";

/** Raiz do dashboard: sempre a aba padrão do portfólio. */
export default function DashboardRootPage() {
  redirect("/dashboard/todos");
}
