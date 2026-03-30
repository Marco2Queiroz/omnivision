"use client";

import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import { buildJqlOperational } from "@/services/jira";
import { useFilterStore } from "@/stores/filter-store";
import type { JiraIssue } from "@/types/jira";
import { useEffect, useMemo, useState } from "react";

function priorityClass(name: string) {
  const n = name.toLowerCase();
  if (n.includes("highest") || n.includes("blocker"))
    return "bg-red-950/80 text-red-200 border-red-500/40";
  if (n.includes("high"))
    return "bg-orange-950/80 text-orange-200 border-orange-500/40";
  if (n.includes("medium"))
    return "bg-amber-950/80 text-amber-200 border-amber-500/40";
  return "bg-slate-800/80 text-slate-300 border-slate-600/40";
}

export function OperationalView() {
  const projectKey = useFilterStore((s) => s.projectKey);
  const responsibleId = useFilterStore((s) => s.responsibleId);

  const jql = useMemo(
    () =>
      buildJqlOperational({
        projectKey: projectKey ?? undefined,
        assignee: responsibleId ?? undefined,
      }),
    [projectKey, responsibleId],
  );

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fallbackPhone =
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_WHATSAPP_FALLBACK ?? ""
      : "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await fetch(
          `/api/jira/search?jql=${encodeURIComponent(jql)}&maxResults=50`,
        );
        const json = await res.json();
        if (!res.ok) throw new Error(json.detail ?? json.error);
        if (!cancelled) setIssues(json.issues ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [jql]);

  return (
    <div className="space-y-6">
      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">
          Granular Operational
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-white">
          Issues críticas
        </h2>
      </div>

      {error ? (
        <p className="rounded border border-error/40 p-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-surface-container/80 text-[10px] font-bold uppercase tracking-widest text-outline">
            <tr>
              <th className="px-4 py-3">Key</th>
              <th className="px-4 py-3">Milestone</th>
              <th className="px-4 py-3">Prioridade</th>
              <th className="px-4 py-3">Stakeholder</th>
              <th className="px-4 py-3">Ação</th>
            </tr>
          </thead>
          <tbody>
            {issues.map((issue) => {
              const summary = String(issue.fields?.summary ?? "");
              const priority = (issue.fields?.priority as { name?: string } | null)
                ?.name ?? "—";
              const assignee = issue.fields?.assignee as {
                displayName?: string;
                emailAddress?: string;
              } | null;
              const owner = assignee?.displayName ?? "Não atribuído";
              const msg = `OmniVision: Olá ${owner}, qual o status da issue ${issue.key} (${summary.slice(0, 80)})?`;
              return (
                <tr
                  key={issue.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container-low/40"
                >
                  <td className="px-4 py-3 font-mono text-primary-container">
                    {issue.key}
                  </td>
                  <td className="max-w-xs truncate px-4 py-3 text-on-surface">
                    {summary}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded border px-2 py-0.5 text-[10px] font-bold uppercase ${priorityClass(priority)}`}
                    >
                      {priority}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {owner}
                  </td>
                  <td className="px-4 py-3">
                    <WhatsAppButton
                      phoneE164Digits={fallbackPhone}
                      message={msg}
                      label="Contato"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        {!issues.length && !error ? (
          <p className="p-8 text-center text-sm text-outline">
            Nenhuma issue retornada para o JQL atual. Ajuste filtros ou
            configure o Jira.
          </p>
        ) : null}
      </div>
    </div>
  );
}
