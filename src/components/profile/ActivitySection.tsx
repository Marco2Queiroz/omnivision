"use client";

import { account } from "@/lib/appwrite";
import { Activity, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";

const DEMO_EVENTS = [
  {
    id: "1",
    action: "Acesso ao painel",
    detail: "Sessão iniciada no ambiente web.",
  },
  {
    id: "2",
    action: "Visualização de portfólio",
    detail: "Área Todos — consulta à grade de projetos.",
  },
];

type Props = {
  hasAppwrite: boolean;
};

export function ActivitySection({ hasAppwrite }: Props) {
  const [email, setEmail] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hasAppwrite) {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      try {
        const u = await account.get();
        if (!c) setEmail(u.email);
      } catch {
        if (!c) setEmail(null);
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [hasAppwrite]);

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
      <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
        <Activity className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        Atividade recente
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
        Linha do tempo operacional (demonstração). Em produção, integre com
        auditoria central (SIEM / Appwrite Audits).
      </p>

      {loading ? (
        <div className="mt-6 flex items-center gap-2 text-sm text-slate-600 dark:text-on-surface-variant">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando contexto…
        </div>
      ) : (
        <ul className="mt-6 space-y-4 border-l-2 border-cyan-500/30 pl-4">
          {DEMO_EVENTS.map((ev, i) => (
            <li key={ev.id} className="relative">
              <span className="absolute -left-[21px] top-1.5 h-2.5 w-2.5 rounded-full bg-cyan-500" />
              <p className="font-medium text-slate-900 dark:text-on-surface">
                {ev.action}
              </p>
              <p className="text-sm text-slate-600 dark:text-on-surface-variant">
                {ev.detail}
              </p>
              <p className="mt-1 text-[10px] uppercase tracking-wider text-slate-400 dark:text-outline">
                Evento {i + 1} — sessão atual
                {email ? ` · ${email}` : ""}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
