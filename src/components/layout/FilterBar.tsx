"use client";

import { useFilterStore } from "@/stores/filter-store";
import { Filter } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function FilterBar() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const dateFrom = useFilterStore((s) => s.dateFrom);
  const dateTo = useFilterStore((s) => s.dateTo);
  const projectKey = useFilterStore((s) => s.projectKey);
  const responsibleId = useFilterStore((s) => s.responsibleId);
  const setFilters = useFilterStore((s) => s.setFilters);

  function applySegmentation() {
    const params = new URLSearchParams(searchParams.toString());
    if (dateFrom) params.set("from", dateFrom);
    else params.delete("from");
    if (dateTo) params.set("to", dateTo);
    else params.delete("to");
    if (projectKey) params.set("project", projectKey);
    else params.delete("project");
    if (responsibleId) params.set("assignee", responsibleId);
    else params.delete("assignee");
    const q = params.toString();
    router.push(q ? `${pathname}?${q}` : pathname);
  }

  return (
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-outline-variant/20 bg-surface-container-low/50 px-4 py-3">
      <div className="flex items-center gap-2 text-primary-container">
        <Filter className="h-4 w-4" />
        <span className="font-headline text-[10px] font-bold uppercase tracking-widest">
          Parâmetros de segmentação
        </span>
      </div>
      <div className="flex min-w-[120px] flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-outline">
          Data (de)
        </label>
        <input
          type="date"
          value={dateFrom ?? ""}
          onChange={(e) =>
            setFilters({ dateFrom: e.target.value || null })
          }
          className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
        />
      </div>
      <div className="flex min-w-[120px] flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-outline">
          Data (até)
        </label>
        <input
          type="date"
          value={dateTo ?? ""}
          onChange={(e) => setFilters({ dateTo: e.target.value || null })}
          className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
        />
      </div>
      <div className="flex min-w-[100px] flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-outline">
          Projeto (key)
        </label>
        <input
          type="text"
          placeholder="ex: frente A"
          value={projectKey ?? ""}
          onChange={(e) =>
            setFilters({ projectKey: e.target.value || null })
          }
          className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
        />
      </div>
      <div className="flex min-w-[120px] flex-col gap-1">
        <label className="text-[10px] font-bold uppercase text-outline">
          Responsável
        </label>
        <input
          type="text"
          placeholder="accountId ou e-mail"
          value={responsibleId ?? ""}
          onChange={(e) =>
            setFilters({ responsibleId: e.target.value || null })
          }
          className="rounded border border-outline-variant/40 bg-surface-container-lowest px-2 py-1.5 text-xs text-on-surface focus:border-primary-container focus:outline-none"
        />
      </div>
      <button
        type="button"
        onClick={applySegmentation}
        className="rounded-lg bg-gradient-to-r from-primary-container to-[#00a8b1] px-4 py-2 font-headline text-xs font-bold uppercase tracking-wide text-on-primary-container shadow-glow transition hover:opacity-95"
      >
        Aplicar
      </button>
    </div>
  );
}
