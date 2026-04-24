"use client";

import { useCorporateProfileStore } from "@/stores/corporate-profile-store";
import { Bell, Save } from "lucide-react";
import { useState } from "react";

export function NotificationsForm() {
  const n = useCorporateProfileStore((s) => s.notifications);
  const setNotifications = useCorporateProfileStore((s) => s.setNotifications);
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Preferências de notificação salvas neste dispositivo.");
  }

  return (
    <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
      <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
        <Bell className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
        Canais de notificação
      </h2>
      <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
        Defina o que deseja receber sobre projetos e segurança. Envio real
        depende da configuração do sistema e do Appwrite.
      </p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-outline-variant/15 dark:bg-surface-dim/40">
          <input
            type="checkbox"
            checked={n.emailProjectUpdates}
            onChange={(e) =>
              setNotifications({ emailProjectUpdates: e.target.checked })
            }
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-900 dark:text-on-surface">
              Atualizações de projetos por e-mail
            </span>
            <span className="text-sm text-slate-600 dark:text-on-surface-variant">
              Marcos, mudanças de status e comentários relevantes ao seu papel.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-outline-variant/15 dark:bg-surface-dim/40">
          <input
            type="checkbox"
            checked={n.emailWeeklyDigest}
            onChange={(e) =>
              setNotifications({ emailWeeklyDigest: e.target.checked })
            }
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-900 dark:text-on-surface">
              Resumo semanal executivo
            </span>
            <span className="text-sm text-slate-600 dark:text-on-surface-variant">
              Síntese de KPIs e riscos da carteira (quando disponível).
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-outline-variant/15 dark:bg-surface-dim/40">
          <input
            type="checkbox"
            checked={n.emailSecurityAlerts}
            onChange={(e) =>
              setNotifications({ emailSecurityAlerts: e.target.checked })
            }
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-900 dark:text-on-surface">
              Alertas de segurança
            </span>
            <span className="text-sm text-slate-600 dark:text-on-surface-variant">
              Novos logins, alterações sensíveis e políticas de senha.
            </span>
          </span>
        </label>
        <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 dark:border-outline-variant/15 dark:bg-surface-dim/40">
          <input
            type="checkbox"
            checked={n.inAppMentions}
            onChange={(e) =>
              setNotifications({ inAppMentions: e.target.checked })
            }
            className="mt-1 rounded border-slate-300"
          />
          <span>
            <span className="block font-medium text-slate-900 dark:text-on-surface">
              Menções no sistema
            </span>
            <span className="text-sm text-slate-600 dark:text-on-surface-variant">
              Notificações dentro do painel quando for citado em comentários.
            </span>
          </span>
        </label>
        <button
          type="submit"
          className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500"
        >
          <Save className="h-4 w-4" />
          Salvar notificações
        </button>
      </form>
      {msg ? (
        <p className="mt-4 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          {msg}
        </p>
      ) : null}
    </section>
  );
}
