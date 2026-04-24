import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";

const STYLE: Record<string, string> = {
  backlog: "border-slate-500/50 bg-slate-800/60 text-slate-200",
  em_andamento:
    "border-primary/35 bg-primary/15 text-primary shadow-[0_0_12px_rgba(145,171,255,0.15)]",
  em_negociacao: "border-amber-500/40 bg-amber-950/50 text-amber-100",
  entregue: "border-emerald-500/40 bg-emerald-950/50 text-emerald-100",
  operacao_assistida:
    "border-violet-500/40 bg-violet-950/50 text-violet-100",
};

const LABEL: Record<string, string> = {
  backlog: "Backlog",
  em_andamento: "Em andamento",
  em_negociacao: "Em negociação",
  entregue: "Entregue",
  operacao_assistida: "Operação assistida",
};

type Props = {
  status: ProjectStatus;
};

export function StatusBadge({ status }: Props) {
  const key = String(status).toLowerCase().replace(/\s+/g, "_");
  const cls =
    STYLE[key] ?? "border-line-subtle bg-surface-container-high text-on-surface";
  const label = LABEL[key] ?? status;
  return (
    <span
      className={cn(
        "inline-flex rounded border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
        cls,
      )}
    >
      {label}
    </span>
  );
}
