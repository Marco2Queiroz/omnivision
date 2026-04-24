"use client";

import type { AccessProfileDoc } from "@/types/access";
import {
  ACCESS_ROLE_LABELS,
  ACCESS_ROLES,
  type AccessRole,
} from "@/types/access";
import { parseAccessRole } from "@/types/access";
import { KeyRound, Plus, RefreshCw, Shield, Wrench } from "lucide-react";
import { useState, useTransition } from "react";
import {
  actionCreateAccessUser,
  actionInitAccessSchema,
  actionSeedTestUser,
  actionUpdateRole,
} from "./actions";

type Props = {
  initialProfiles: AccessProfileDoc[];
  layerConfigured: boolean;
  includeSetupActions?: boolean;
};

export function AccessManagementClient({
  initialProfiles,
  layerConfigured,
  includeSetupActions = true,
}: Props) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function refreshFromServer() {
    startTransition(async () => {
      setMessage(null);
      setError(null);
      const res = await fetch("/api/access/profiles", { cache: "no-store" });
      const json = await res.json();
      if (res.ok && Array.isArray(json)) {
        setProfiles(json);
      }
    });
  }

  return (
    <div className="space-y-8">
      <div>
        <span className="mb-2 block text-xs font-bold uppercase tracking-[0.2em] text-tertiary">
          Administração
        </span>
        <h2 className="font-headline text-3xl font-extrabold text-on-surface">
          Gestão de acesso
        </h2>
      </div>

      {!layerConfigured ? (
        <div className="rounded-xl border border-amber-500/30 bg-amber-950/20 p-4 text-sm text-amber-100">
          <p className="font-headline font-bold uppercase tracking-wide">
            Configuração necessária
          </p>
          <p className="mt-2 text-on-surface-variant">
            Defina <code className="text-primary-container">APPWRITE_API_KEY</code>,{" "}
            <code className="text-primary-container">APPWRITE_DATABASE_ID</code> e
            opcionalmente{" "}
            <code className="text-primary-container">
              APPWRITE_ACCESS_COLLECTION_ID
            </code>{" "}
            (padrão: <code className="text-primary-container">access_profiles</code>
            ).
            {includeSetupActions
              ? " Depois execute a criação da coleção abaixo."
              : " Depois, na página Gestão de acesso (menu do dashboard), use o botão de criar a estrutura se ainda não existir a coleção."}
          </p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-3">
        {includeSetupActions ? (
          <>
            <form
              action={async () => {
                setMessage(null);
                setError(null);
                startTransition(async () => {
                  const r = await actionInitAccessSchema();
                  if (r.ok) setMessage(r.message);
                  else setError(r.message);
                });
              }}
            >
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg border border-outline-variant/40 bg-surface-container-high px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-primary-container transition hover:bg-surface-container-highest disabled:opacity-50"
              >
                <Wrench className="h-4 w-4" />
                Criar estrutura no Appwrite
              </button>
            </form>

            <form
              action={async () => {
                setMessage(null);
                setError(null);
                startTransition(async () => {
                  const r = await actionSeedTestUser();
                  if (r.ok) {
                    setMessage(
                      `Usuário de teste pronto: ${r.email} (senha no .env ou padrão).`,
                    );
                    refreshFromServer();
                  } else setError(r.error);
                });
              }}
            >
              <button
                type="submit"
                disabled={pending}
                className="inline-flex items-center gap-2 rounded-lg border border-primary-container/40 bg-primary-container/15 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-primary-container transition hover:bg-primary-container/25 disabled:opacity-50"
              >
                <KeyRound className="h-4 w-4" />
                Criar usuário teste local
              </button>
            </form>
          </>
        ) : null}

        <button
          type="button"
          onClick={refreshFromServer}
          disabled={pending}
            className="inline-flex items-center gap-2 rounded-lg border border-line-field bg-surface-container-high/80 px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-on-surface-variant transition hover:bg-surface-container-highest disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 ${pending ? "animate-spin" : ""}`} />
          Atualizar lista
        </button>
      </div>

      {message ? (
        <p className="rounded-lg border border-emerald-500/30 bg-emerald-950/30 p-3 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-lg border border-error/40 bg-error-container/20 p-3 text-sm text-error">
          {error}
        </p>
      ) : null}

      <div className="glass-card rounded-xl border border-outline-variant/20 p-6">
        <h3 className="mb-4 flex items-center gap-2 font-headline text-sm font-bold uppercase tracking-widest text-outline">
          <Plus className="h-4 w-4 text-primary-container" />
          Novo usuário
        </h3>
        <form
          className="grid gap-4 md:grid-cols-2"
          action={async (fd) => {
            setMessage(null);
            setError(null);
            startTransition(async () => {
              const r = await actionCreateAccessUser(fd);
              if (r.ok) {
                setMessage("Usuário criado com sucesso.");
                refreshFromServer();
              } else setError(r.error);
            });
          }}
        >
          <div>
            <label className="text-[10px] font-bold uppercase text-outline">
              Nome
            </label>
            <input
              name="name"
              className="mt-1 w-full rounded border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none"
              placeholder="Nome exibido"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-outline">
              E-mail
            </label>
            <input
              name="email"
              type="email"
              required
              className="mt-1 w-full rounded border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none"
              placeholder="email@empresa.com"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-outline">
              Senha (mín. 8 caracteres)
            </label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="mt-1 w-full rounded border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase text-outline">
              Nível de acesso
            </label>
            <select
              name="role"
              defaultValue="leitor"
              className="mt-1 w-full rounded border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface focus:border-primary-container focus:outline-none"
            >
              {ACCESS_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ACCESS_ROLE_LABELS[r]}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2">
            <button
              type="submit"
              disabled={pending}
              className="rounded-lg bg-gradient-to-r from-primary-container to-[#00a8b1] px-6 py-3 font-headline text-xs font-bold uppercase tracking-wider text-on-primary-container shadow-glow disabled:opacity-50"
            >
              Cadastrar
            </button>
          </div>
        </form>
      </div>

      <div className="glass-card overflow-hidden rounded-xl border border-outline-variant/20">
        <h3 className="border-b border-outline-variant/20 bg-surface-container-high/80 px-4 py-3 font-headline text-xs font-bold uppercase tracking-widest text-primary-container">
          <span className="flex items-center gap-2">
            <Shield className="h-4 w-4" />
            Perfis cadastrados
          </span>
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="bg-surface-container/80 text-[10px] font-bold uppercase tracking-widest text-outline">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Nível</th>
                <th className="px-4 py-3">Ativo</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((p) => (
                <tr
                  key={p.id}
                  className="border-t border-outline-variant/10 hover:bg-surface-container-low/40"
                >
                  <td className="px-4 py-3 text-on-surface">{p.name || "—"}</td>
                  <td className="px-4 py-3 font-mono text-xs text-primary-container">
                    {p.email}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      defaultValue={p.role}
                      disabled={pending}
                      onChange={(e) => {
                        const role = parseAccessRole(e.target.value) as AccessRole;
                        startTransition(async () => {
                          const r = await actionUpdateRole(p.id, role);
                          if (!r.ok) setError(r.error);
                          else setMessage("Nível atualizado.");
                        });
                      }}
                      className="rounded border border-line-field bg-surface-container-low px-2 py-1 text-xs text-on-surface"
                    >
                      {ACCESS_ROLES.map((r) => (
                        <option key={r} value={r}>
                          {ACCESS_ROLE_LABELS[r]}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-on-surface-variant">
                    {p.active ? "Sim" : "Não"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!profiles.length ? (
            <p className="p-8 text-center text-sm text-outline">
              {includeSetupActions
                ? 'Nenhum perfil ainda. Crie a estrutura no Appwrite e cadastre um usuário ou use "usuário teste local".'
                : "Nenhum perfil ainda. Cadastre um usuário com o formulário acima."}
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
