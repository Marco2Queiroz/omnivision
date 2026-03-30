"use client";

import { buildJqlTactical } from "@/services/jira";
import { useFilterStore } from "@/stores/filter-store";
import type { JiraIssue } from "@/types/jira";
import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/** Placeholder de tendência quando não há histórico de Lead Time no Jira. */
const MOCK_LEAD = [
  { week: "S1", lead: 4.2, throughput: 18 },
  { week: "S2", lead: 3.8, throughput: 22 },
  { week: "S3", lead: 4.5, throughput: 19 },
  { week: "S4", lead: 3.2, throughput: 26 },
  { week: "S5", lead: 3.0, throughput: 28 },
];

export function TacticalView() {
  const projectKey = useFilterStore((s) => s.projectKey);
  const responsibleId = useFilterStore((s) => s.responsibleId);

  const jql = useMemo(
    () =>
      buildJqlTactical({
        projectKey: projectKey ?? undefined,
        assignee: responsibleId ?? undefined,
      }),
    [projectKey, responsibleId],
  );

  const [issues, setIssues] = useState<JiraIssue[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setError(null);
      try {
        const res = await fetch(
          `/api/jira/search?jql=${encodeURIComponent(jql)}&maxResults=40`,
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
  }, [jql, responsibleId]);

  const throughputData = useMemo(() => {
    return MOCK_LEAD.map((row, i) => ({
      ...row,
      throughput: Math.min(
        40,
        (issues.length ? issues.length / 5 : row.throughput) + i,
      ),
    }));
  }, [issues.length]);

  return (
    <div className="space-y-8">
      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-cyan-500">
          Tactical Alignment
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-white">
          Squad efficiency
        </h2>
        <p className="mt-2 max-w-2xl text-sm text-on-surface-variant">
          Lead Time e throughput: linha azul usa série de referência; entregas
          ativas no período: {issues.length} issues.
        </p>
      </div>

      {error ? (
        <p className="rounded border border-error/40 p-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="glass-card rounded-xl p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Lead Time (dias) — referência
        </h3>
        <div className="h-72 min-h-[288px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={throughputData}>
              <CartesianGrid stroke="rgba(58,73,75,0.15)" />
              <XAxis dataKey="week" tick={{ fill: "#b9cacb", fontSize: 11 }} />
              <YAxis tick={{ fill: "#b9cacb", fontSize: 11 }} />
              <Tooltip
                contentStyle={{
                  background: "#11212f",
                  border: "1px solid rgba(0,242,255,0.2)",
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="lead"
                name="Lead Time"
                stroke="#00f2ff"
                strokeWidth={2}
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="throughput"
                name="Throughput (ref.)"
                stroke="#571bc1"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
