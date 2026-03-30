"use client";

import { useFilterStore } from "@/stores/filter-store";
import { buildJqlEpics } from "@/services/jira";
import type { JiraIssue } from "@/types/jira";
import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const COLORS = ["#00f2ff", "#571bc1", "#76ebff", "#d0bcff"];

export function StrategicView() {
  const projectKey = useFilterStore((s) => s.projectKey);
  const dateFrom = useFilterStore((s) => s.dateFrom);
  const dateTo = useFilterStore((s) => s.dateTo);
  const responsibleId = useFilterStore((s) => s.responsibleId);

  const jql = useMemo(
    () =>
      buildJqlEpics({
        projectKey: projectKey ?? undefined,
        dateFrom: dateFrom ?? undefined,
        dateTo: dateTo ?? undefined,
        assignee: responsibleId ?? undefined,
      }),
    [projectKey, dateFrom, dateTo, responsibleId],
  );

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(
          `/api/jira/search?jql=${encodeURIComponent(jql)}&maxResults=50`,
        );
        const json = await res.json();
        if (!res.ok) {
          throw new Error(json.detail ?? json.error ?? "Falha na API");
        }
        if (!cancelled) setIssues(json.issues ?? []);
      } catch (e) {
        if (!cancelled)
          setError(e instanceof Error ? e.message : "Erro ao carregar Jira");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [jql]);

  const statusBuckets = useMemo(() => {
    const map = new Map<string, number>();
    for (const issue of issues) {
      const statusName =
        (issue.fields?.status as { name?: string } | undefined)?.name ??
        "Unknown";
      map.set(statusName, (map.get(statusName) ?? 0) + 1);
    }
    return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
  }, [issues]);

  const donutData = statusBuckets.slice(0, 6);

  const healthScore = useMemo(() => {
    if (!issues.length) return 0;
    const done =
      issues.filter(
        (i) =>
          ((i.fields?.status as { name?: string })?.name ?? "").toLowerCase() ===
          "done",
      ).length / issues.length;
    return Math.round(done * 100);
  }, [issues]);

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">
            Holistic Strategy
          </span>
          <h2 className="font-headline text-3xl font-extrabold tracking-tight text-white">
            CEO Viewpoint
          </h2>
        </div>
        <div className="flex items-center gap-3 rounded-lg border border-cyan-500/10 bg-cyan-950/20 px-4 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-emerald-500" />
          <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
            High-Level Health: {healthScore || "—"}
          </span>
        </div>
      </section>

      {error ? (
        <p className="rounded-lg border border-error/40 bg-error-container/20 p-4 text-sm text-error">
          {error} — verifique JIRA_* no servidor e o JQL.
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
        <div className="glass-card relative overflow-hidden rounded-xl p-8 md:col-span-5">
          <div className="absolute left-0 top-0 h-1 w-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent opacity-50" />
          <h3 className="mb-6 text-center text-xs font-bold uppercase tracking-widest text-slate-400">
            Aggregate Health Score
          </h3>
          <div className="relative mx-auto flex h-48 w-48 items-center justify-center">
            <span className="font-headline text-6xl font-black text-white">
              {loading ? "…" : healthScore}
            </span>
          </div>
          <p className="mt-4 text-center text-xs text-cyan-400">
            Strategic Outcomes (épicos analisados: {issues.length})
          </p>
        </div>

        <div className="glass-card rounded-xl p-6 md:col-span-7">
          <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
            Milestones por status
          </h3>
          <div className="h-64 min-h-[256px] w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={statusBuckets}>
                <CartesianGrid stroke="rgba(58,73,75,0.15)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#b9cacb", fontSize: 10 }} />
                <YAxis tick={{ fill: "#b9cacb", fontSize: 10 }} />
                <Tooltip
                  contentStyle={{
                    background: "#11212f",
                    border: "1px solid rgba(0,242,255,0.2)",
                  }}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {statusBuckets.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Distribuição (donut)
        </h3>
        <div className="h-64 min-h-[256px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={donutData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
              >
                {donutData.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
