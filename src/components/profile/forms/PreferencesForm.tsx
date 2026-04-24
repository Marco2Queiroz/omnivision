"use client";

import { useCorporateProfileStore } from "@/stores/corporate-profile-store";
import { Save, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function PreferencesForm() {
  const preferences = useCorporateProfileStore((s) => s.preferences);
  const setPreferences = useCorporateProfileStore((s) => s.setPreferences);
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Preferências regionais salvas neste dispositivo.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
        <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
          <SlidersHorizontal className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          Regionalização
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
          Idioma e fuso para exibição. O tema claro/escuro é controlado no
          cabeçalho do sistema.
        </p>
        <form onSubmit={onSubmit} className="mt-6 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Idioma da interface
            </label>
            <select
              value={preferences.language}
              onChange={(e) =>
                setPreferences({
                  language: e.target.value as typeof preferences.language,
                })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            >
              <option value="pt-BR">Português (Brasil)</option>
              <option value="en-US">English (US)</option>
              <option value="es">Español</option>
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Fuso horário
            </label>
            <select
              value={preferences.timezone}
              onChange={(e) =>
                setPreferences({ timezone: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            >
              <option value="America/Sao_Paulo">America/São Paulo</option>
              <option value="America/Manaus">America/Manaus</option>
              <option value="America/Recife">America/Recife</option>
              <option value="UTC">UTC</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Formato de data (referência)
            </label>
            <input
              value={preferences.dateDisplayHint}
              onChange={(e) =>
                setPreferences({ dateDisplayHint: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="dd/MM/yyyy"
            />
          </div>
          <div className="md:col-span-2 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500"
            >
              <Save className="h-4 w-4" />
              Salvar preferências
            </button>
            <Link
              href="/dashboard/todos"
              className="text-sm font-medium text-cyan-700 underline dark:text-cyan-400"
            >
              Voltar ao dashboard
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-sm text-slate-600 dark:border-outline-variant/15 dark:bg-surface-dim/30 dark:text-on-surface-variant">
        <strong className="text-slate-800 dark:text-on-surface">Aparência:</strong>{" "}
        use o ícone de sol/lua no topo da página para alternar tema claro e
        escuro (persistido pelo navegador).
      </section>

      {msg ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
