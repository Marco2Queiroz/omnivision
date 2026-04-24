"use client";

import { useCorporateProfileStore } from "@/stores/corporate-profile-store";
import { Building2, Save } from "lucide-react";
import { useState } from "react";

export function OrganizationForm() {
  const organization = useCorporateProfileStore((s) => s.organization);
  const setOrganization = useCorporateProfileStore((s) => s.setOrganization);
  const [msg, setMsg] = useState<string | null>(null);

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("Dados de organização atualizados neste dispositivo.");
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
        <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
          <Building2 className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          Estrutura organizacional
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
          Informações para contexto no portfólio e relatórios. Oficial: cadastro
          de RH / ERP.
        </p>
        <form
          onSubmit={onSubmit}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div className="md:col-span-2">
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Razão social / empresa
            </label>
            <input
              value={organization.companyLegalName}
              onChange={(e) =>
                setOrganization({ companyLegalName: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Unidade de negócio
            </label>
            <input
              value={organization.businessUnit}
              onChange={(e) =>
                setOrganization({ businessUnit: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="Ex.: Holding, Filial SP"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Área / célula
            </label>
            <input
              value={organization.area}
              onChange={(e) => setOrganization({ area: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Centro de custo
            </label>
            <input
              value={organization.costCenter}
              onChange={(e) =>
                setOrganization({ costCenter: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="Ex.: CC-TI-001"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              País
            </label>
            <input
              value={organization.country}
              onChange={(e) => setOrganization({ country: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Localização (cidade / site)
            </label>
            <input
              value={organization.location}
              onChange={(e) =>
                setOrganization({ location: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Gestor direto (nome)
            </label>
            <input
              value={organization.managerName}
              onChange={(e) =>
                setOrganization({ managerName: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              E-mail do gestor
            </label>
            <input
              type="email"
              value={organization.managerEmail}
              onChange={(e) =>
                setOrganization({ managerEmail: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500"
            >
              <Save className="h-4 w-4" />
              Salvar organização
            </button>
          </div>
        </form>
      </section>
      {msg ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          {msg}
        </p>
      ) : null}
    </div>
  );
}
