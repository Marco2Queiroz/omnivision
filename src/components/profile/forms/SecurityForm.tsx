"use client";

import { account } from "@/lib/appwrite";
import { KeyRound, Loader2, Shield } from "lucide-react";
import { useState } from "react";

type Props = {
  hasAppwrite: boolean;
};

export function SecurityForm({ hasAppwrite }: Props) {
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMsg(null);
    setErr(null);
    if (!hasAppwrite) {
      setErr("Appwrite não configurado.");
      return;
    }
    if (newPassword.length < 8) {
      setErr("A nova senha deve ter no mínimo 8 caracteres.");
      return;
    }
    if (newPassword !== confirm) {
      setErr("Confirmação da nova senha não confere.");
      return;
    }
    setLoading(true);
    try {
      await account.updatePassword({
        password: newPassword,
        oldPassword: oldPassword,
      });
      setMsg("Senha alterada com sucesso.");
      setOldPassword("");
      setNewPassword("");
      setConfirm("");
    } catch (e) {
      setErr(
        e instanceof Error
          ? e.message
          : "Não foi possível alterar a senha. Verifique a senha atual.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl border border-slate-200/80 bg-white/95 p-6 shadow-sm dark:border-outline-variant/25 dark:bg-surface-container/50">
        <h2 className="flex items-center gap-2 font-headline text-lg font-bold text-slate-900 dark:text-on-surface">
          <Shield className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
          Senha da conta
        </h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-on-surface-variant">
          Política mínima: 8 caracteres. Em ambientes corporativos, combine com
          MFA/SSO quando disponível.
        </p>
        <form onSubmit={(e) => void onSubmit(e)} className="mt-6 max-w-lg space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Senha atual
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              required
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Nova senha
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              required
              minLength={8}
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-slate-500 dark:text-outline">
              Confirmar nova senha
            </label>
            <input
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm dark:border-outline-variant/30 dark:bg-surface-container-low dark:text-on-surface"
              required
              minLength={8}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !hasAppwrite}
            className="inline-flex items-center gap-2 rounded-lg bg-cyan-600 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-white hover:bg-cyan-500 disabled:opacity-50"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <KeyRound className="h-4 w-4" />
            )}
            Atualizar senha
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 p-6 dark:border-outline-variant/25 dark:bg-surface-dim/30">
        <h3 className="font-headline text-sm font-bold text-slate-800 dark:text-on-surface">
          SSO e MFA
        </h3>
        <p className="mt-2 text-sm text-slate-600 dark:text-on-surface-variant">
          Integração com provedor corporativo (SAML / OIDC) e autenticação em
          duas etapas serão habilitadas quando o IdP da empresa for conectado ao
          Appwrite. Esta área permanece preparada para comunicação à diretoria e
          auditoria.
        </p>
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
