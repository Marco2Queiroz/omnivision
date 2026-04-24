"use client";

import { account } from "@/lib/appwrite";
import { useCorporateProfileStore } from "@/stores/corporate-profile-store";
import { Loader2, Mail, Save, UserCircle } from "lucide-react";
import { useEffect, useState } from "react";

type Props = {
  hasAppwrite: boolean;
};

export function PersonalDataForm({ hasAppwrite }: Props) {
  const personal = useCorporateProfileStore((s) => s.personal);
  const setPersonal = useCorporateProfileStore((s) => s.setPersonal);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [verified, setVerified] = useState(false);
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (!hasAppwrite) {
      setLoading(false);
      return;
    }
    let c = false;
    (async () => {
      try {
        const u = await account.get();
        if (c) return;
        setName(u.name ?? "");
        setEmail(u.email);
        setVerified(Boolean(u.emailVerification));
        setUserId(u.$id);
      } catch {
        setErr("Sessão não encontrada. Faça login.");
      } finally {
        if (!c) setLoading(false);
      }
    })();
    return () => {
      c = true;
    };
  }, [hasAppwrite]);

  async function onSaveIdentity(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!hasAppwrite) {
      setErr("Appwrite não configurado.");
      return;
    }
    setSaving(true);
    try {
      await account.updateName({ name: name.trim() });
      setMsg("Nome atualizado com sucesso.");
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Falha ao atualizar nome.");
    } finally {
      setSaving(false);
    }
  }

  function onSaveCorporate(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(
      "Dados corporativos confirmados (já persistidos automaticamente neste dispositivo).",
    );
  }

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-on-surface-variant">
        <Loader2 className="h-4 w-4 animate-spin text-primary-container" />
        Carregando dados da conta…
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
        <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
          <UserCircle className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          Identidade na conta
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
          Nome e e-mail são geridos pelo Appwrite (provedor de autenticação).
        </p>
        <form onSubmit={onSaveIdentity} className="mt-6 grid gap-4 md:grid-cols-2">
          <div className="md:col-span-2 flex flex-wrap items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300">
              <UserCircle className="h-10 w-10" />
            </div>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-outline">
                ID do usuário
              </p>
              <code className="break-all text-xs text-slate-800 dark:text-on-surface">
                {userId || "—"}
              </code>
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Nome completo
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              E-mail corporativo
            </label>
            <div className="mt-1 flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-outline-variant/30 dark:bg-surface-dim/40 dark:text-on-surface-variant">
              <Mail className="h-4 w-4 shrink-0" />
              <span className="min-w-0 flex-1 truncate">{email || "—"}</span>
              <span
                className={
                  verified
                    ? "rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold uppercase text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-200"
                    : "rounded bg-amber-100 px-2 py-0.5 text-[10px] font-bold uppercase text-amber-900 dark:bg-amber-950/50 dark:text-amber-100"
                }
              >
                {verified ? "Verificado" : "Não verificado"}
              </span>
            </div>
            <p className="mt-1 text-[11px] text-slate-500 dark:text-outline">
              Alteração de e-mail usa fluxo do Appwrite (segurança).
            </p>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={saving || !hasAppwrite}
              className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              Salvar nome
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
        <h2 className="font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
          Contato e vínculo corporativo
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
          Preenchimento local para exibição no painel; integração com RH pode
          substituir estes campos no futuro.
        </p>
        <form
          onSubmit={onSaveCorporate}
          className="mt-6 grid gap-4 md:grid-cols-2"
        >
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Ramal / telefone fixo
            </label>
            <input
              value={personal.phone}
              onChange={(e) => setPersonal({ phone: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="+55 11 3000-0000"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Celular corporativo
            </label>
            <input
              value={personal.mobile}
              onChange={(e) => setPersonal({ mobile: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="+55 11 90000-0000"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Cargo / função
            </label>
            <input
              value={personal.jobTitle}
              onChange={(e) => setPersonal({ jobTitle: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="Ex.: Gerente de Projetos"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Departamento / diretoria
            </label>
            <input
              value={personal.department}
              onChange={(e) => setPersonal({ department: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="Ex.: TI — Projetos"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Matrícula / ID interno
            </label>
            <input
              value={personal.employeeId}
              onChange={(e) => setPersonal({ employeeId: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Alias de e-mail (opcional)
            </label>
            <input
              value={personal.internalEmailAlias}
              onChange={(e) =>
                setPersonal({ internalEmailAlias: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              placeholder="nome.sobrenome@empresa.com"
            />
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-slate-800 hover:bg-slate-50 dark:border-outline-variant/30 dark:bg-surface-container-high dark:text-on-surface dark:hover:bg-surface-container-highest"
            >
              <Save className="h-4 w-4" />
              Salvar dados corporativos
            </button>
          </div>
        </form>
      </section>

      {msg ? (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
          {msg}
        </p>
      ) : null}
      {err ? (
        <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-900 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-100">
          {err}
        </p>
      ) : null}
    </div>
  );
}
