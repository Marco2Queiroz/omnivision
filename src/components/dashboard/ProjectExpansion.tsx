import type { ProjectRecord } from "@/types/project";

type Props = {
  project: ProjectRecord;
};

export function ProjectExpansion({ project }: Props) {
  return (
    <div className="rounded-lg border border-line-subtle bg-surface-container-low/80 p-4 text-sm">
      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Descrição
          </p>
          <p className="mt-1 text-on-surface">{project.description || "—"}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-outline">
            Atualizações
          </p>
          <p className="mt-1 text-on-surface-variant">
            {project.updates || "—"}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-4 pt-4 text-xs text-on-surface-variant">
        <span>
          Progresso (ref.):{" "}
          <strong className="text-on-surface">
            {project.plannedHours > 0
              ? Math.round(
                  (project.actualHours / project.plannedHours) * 100,
                )
              : 0}
            %
          </strong>
        </span>
        <span>
          Risco:{" "}
          <strong className="text-on-surface">
            {project.risk?.trim() || "—"}
          </strong>
        </span>
      </div>
      {project.link?.trim() || project.client?.trim() || project.tags?.trim() ? (
        <div className="mt-3 grid gap-2 text-xs text-on-surface-variant md:grid-cols-3">
          {project.client?.trim() ? (
            <span>
              Cliente:{" "}
              <strong className="text-on-surface">{project.client}</strong>
            </span>
          ) : null}
          {project.tags?.trim() ? (
            <span>
              Tags:{" "}
              <strong className="text-on-surface">{project.tags}</strong>
            </span>
          ) : null}
          {project.link?.trim() ? (
            <span className="truncate">
              Link:{" "}
              <a
                href={project.link}
                className="font-semibold text-primary-container underline"
                target="_blank"
                rel="noreferrer"
              >
                {project.link}
              </a>
            </span>
          ) : null}
        </div>
      ) : null}
      <p className="mt-3 text-[10px] text-outline">
        Entregáveis vinculados virão de `project_items` após import Excel.
      </p>
    </div>
  );
}
