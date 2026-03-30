"use client";

import { WhatsAppButton } from "@/components/whatsapp/WhatsAppButton";
import type { PlanoCriseGeo } from "@/types/geo";
import { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const UPTIME_MOCK = [
  { t: "00:00", pct: 99.92 },
  { t: "04:00", pct: 99.95 },
  { t: "08:00", pct: 99.88 },
  { t: "12:00", pct: 99.97 },
  { t: "16:00", pct: 99.9 },
  { t: "20:00", pct: 99.94 },
];

export function GeoWarRoom() {
  const [plans, setPlans] = useState<PlanoCriseGeo[]>([]);
  const [err, setErr] = useState<string | null>(null);

  const fallbackPhone =
    process.env.NEXT_PUBLIC_WHATSAPP_FALLBACK ?? "";

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/geo/plans");
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Erro");
        if (!cancelled) setPlans(json);
      } catch (e) {
        if (!cancelled)
          setErr(e instanceof Error ? e.message : "Falha ao carregar planos");
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-red-400">
            Crisis Resolution — Geo
          </span>
          <h2 className="font-headline text-3xl font-extrabold text-white">
            War Room
          </h2>
          <p className="mt-2 text-sm text-on-surface-variant">
            Uptime de referência (mock) e planos de ação persistidos no
            Supabase.
          </p>
        </div>
        <div className="flex items-center gap-2 rounded border border-red-500/30 bg-red-950/30 px-3 py-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-red-200">
            Incident mode
          </span>
        </div>
      </div>

      <div className="glass-card rounded-xl p-6">
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Geo — Uptime (%)
        </h3>
        <div className="h-64 min-h-[256px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={UPTIME_MOCK}>
              <defs>
                <linearGradient id="upG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#00f2ff" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="#00f2ff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="rgba(58,73,75,0.12)" />
              <XAxis dataKey="t" tick={{ fill: "#b9cacb", fontSize: 10 }} />
              <YAxis
                domain={[99.8, 100]}
                tick={{ fill: "#b9cacb", fontSize: 10 }}
              />
              <Tooltip
                contentStyle={{
                  background: "#11212f",
                  border: "1px solid rgba(255,100,100,0.3)",
                }}
              />
              <Area
                type="monotone"
                dataKey="pct"
                stroke="#00f2ff"
                fill="url(#upG)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div>
        <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">
          Planos de ação (planos_crise_geo)
        </h3>
        {err ? (
          <p className="text-sm text-error">{err}</p>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-outline-variant/20">
            <table className="w-full text-left text-sm">
              <thead className="bg-surface-container/80 text-[10px] font-bold uppercase tracking-widest text-outline">
                <tr>
                  <th className="px-4 py-3">Título</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Owner</th>
                  <th className="px-4 py-3">WhatsApp</th>
                </tr>
              </thead>
              <tbody>
                {plans.map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-outline-variant/10 hover:bg-surface-container-low/40"
                  >
                    <td className="px-4 py-3 font-medium text-on-surface">
                      {p.titulo}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {p.status}
                    </td>
                    <td className="px-4 py-3 text-on-surface-variant">
                      {p.owner_name ?? "—"}
                    </td>
                    <td className="px-4 py-3">
                      <WhatsAppButton
                        phoneE164Digits={fallbackPhone}
                        message={`OmniVision War Room: status do plano "${p.titulo}"?`}
                        label="Ping"
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!plans.length ? (
              <p className="p-6 text-center text-sm text-outline">
                Nenhum plano cadastrado. Insira linhas na tabela
                planos_crise_geo no Supabase.
              </p>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
