"use client";

import { AccessManagementClient } from "@/app/(dashboard)/dashboard/access/AccessManagementClient";
import { SystemParamsSection } from "@/components/settings/SystemParamsSection";
import type { AccessProfileDoc } from "@/types/access";
import type { UiPreferences } from "@/domain/settings/types";
import type { ImportLogRow } from "@/services/import-logs-service";
import type { StatusConfigRow } from "@/services/settings-service";
import { actionEnsureProjectsSchema } from "@/app/(dashboard)/settings/actions";
import type { ProjectRecord } from "@/types/project";
import {
  summarizeDates,
  validateProjectRows,
} from "@/domain/excel/validateImportRows";
import { Loader2, Table2, Trash2, Wrench } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

async function readImportApiJson(
  res: Response,
): Promise<Record<string, unknown>> {
  const text = await res.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return { error: `Resposta inválida do servidor (HTTP ${res.status}).` };
  }
}

function messageForImportHttpError(
  res: Response,
  json: Record<string, unknown>,
): string {
  const fallback = String(json.error ?? "").trim();
  if (res.status === 401) {
    return "Sessão expirada ou ausente. Entre novamente e tente o upload.";
  }
  if (res.status === 403) {
    return (
      fallback ||
      "Sem permissão para importar. O perfil precisa ser Gestor ou Admin (coleção access_profiles no Appwrite)."
    );
  }
  if (res.status === 413) {
    return "Requisição muito grande. Tente menos linhas ou um arquivo menor.";
  }
  if (fallback) return fallback;
  return `Falha na operação (HTTP ${res.status}).`;
}

type Props = {
  initialProfiles: AccessProfileDoc[];
  layerConfigured: boolean;
  appSettings: {
    hour_value: number;
    capex_formula: string;
    ui_preferences: UiPreferences;
  };
  statusConfigs: StatusConfigRow[];
  importLogs: ImportLogRow[];
};

export function AdminSettingsView({
  initialProfiles,
  layerConfigured,
  appSettings,
  statusConfigs,
  importLogs,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  return (
    <div className="mx-auto max-w-5xl space-y-8 pb-16">
      <header className="space-y-2">
        <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-primary">
          Admin Console
        </p>
        <h1 className="font-headline text-2xl font-extrabold tracking-tight text-on-surface md:text-3xl">
          Configurações do sistema
        </h1>
        <p className="max-w-3xl text-sm text-on-surface-variant">
          Governança operacional: importação Excel, usuários e parametrizações do
          dashboard executivo.
        </p>
      </header>

      <ExcelImportSection importLogs={importLogs} />

      <section className="ui-surface-raised p-6">
        <div className="rounded-xl border border-line-subtle/80 bg-surface-container-low/90 p-4 backdrop-blur-sm">
          <AccessManagementClient
            initialProfiles={initialProfiles}
            layerConfigured={layerConfigured}
            includeSetupActions={false}
          />
        </div>
      </section>

      <SystemParamsSection
        appSettings={appSettings}
        statusConfigs={statusConfigs}
        pending={pending}
        startTransition={startTransition}
        onRefresh={() => router.refresh()}
      />
    </div>
  );
}

function ExcelImportSection({ importLogs }: { importLogs: ImportLogRow[] }) {
  const router = useRouter();
  const [schemaPending, startSchema] = useTransition();
  const [schemaNotice, setSchemaNotice] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [fileLabel, setFileLabel] = useState<string | null>(null);
  const [projects, setProjects] = useState<ProjectRecord[] | null>(null);
  const [issues, setIssues] = useState<
    ReturnType<typeof validateProjectRows>
  >([]);
  const [summary, setSummary] = useState<ReturnType<
    typeof summarizeDates
  > | null>(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
  const [clearing, setClearing] = useState(false);

  async function parseFile(f: File) {
    setLoading(true);
    setMessage(null);
    setError(null);
    setProjects(null);
    setFileLabel(f.name);
    try {
      const fd = new FormData();
      fd.set("file", f);
      const res = await fetch("/api/import/excel", {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const json = await readImportApiJson(res);
      if (!res.ok) {
        setError(messageForImportHttpError(res, json));
        return;
      }
      const rows = json.projects as ProjectRecord[] | undefined;
      if (!Array.isArray(rows) || rows.length === 0) {
        setError(
          "Nenhuma linha de dados encontrada. Use a 1ª linha com cabeçalhos reconhecidos (ex.: Nome do projeto, Área, Status), pelo menos uma linha de dados e a aba correta do .xlsx.",
        );
        setProjects(null);
        return;
      }
      setProjects(rows);
      setIssues(
        (json.issues ?? []) as ReturnType<typeof validateProjectRows>,
      );
      setSummary(
        (json.summary ?? null) as ReturnType<typeof summarizeDates> | null,
      );
    } catch {
      setError("Erro de rede ao enviar o arquivo.");
    } finally {
      setLoading(false);
    }
  }

  async function confirmImport() {
    if (!fileLabel) return;
    if (!projects?.length) {
      setError(
        "Não há linhas para importar. Envie o Excel novamente e confira a pré-visualização.",
      );
      return;
    }
    setImporting(true);
    setMessage(null);
    setError(null);
    try {
      const res = await fetch("/api/import/excel", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rows: projects,
          mode: "replace" as const,
          fileName: fileLabel,
        }),
      });
      const json = await readImportApiJson(res);
      if (!res.ok) {
        setError(messageForImportHttpError(res, json));
        return;
      }
      const imported = Number(json.imported ?? 0);
      const base = `Importação concluída: ${imported} projeto(s).`;
      const warn = json.logWarning != null ? String(json.logWarning) : "";
      setMessage(
        warn
          ? `${base} Atenção: histórico não gravado — ${warn}`
          : base,
      );
      setProjects(null);
      setFileLabel(null);
      router.refresh();
    } catch {
      setError("Erro de rede na importação.");
    } finally {
      setImporting(false);
    }
  }

  async function confirmClearBase() {
    setClearing(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch("/api/settings/clear-portfolio", {
        method: "POST",
        credentials: "include",
      });
      const json = await readImportApiJson(res);
      if (!res.ok) {
        setError(
          messageForImportHttpError(res, json) ||
            String(json.error ?? "Falha ao limpar a base."),
        );
        return;
      }
      const warn =
        json.warning != null && String(json.warning).trim() !== ""
          ? String(json.warning)
          : "";
      setMessage(
        warn
          ? `Base de projetos e histórico de import Excel zerados. ${warn}`
          : "Base de projetos e histórico de import Excel zerados. Pode subir um novo .xlsx.",
      );
      setClearConfirmOpen(false);
      setProjects(null);
      setFileLabel(null);
      setSummary(null);
      setIssues([]);
      router.refresh();
    } catch {
      setError("Erro de rede ao limpar a base.");
    } finally {
      setClearing(false);
    }
  }

  const sum = summary;

  return (
    <section className="ui-surface-raised p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-primary/30 bg-primary/12 p-2 text-primary shadow-[0_0_20px_rgba(145,171,255,0.12)]">
          <Table2 className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Upload e gestão do Excel
          </h2>
          {schemaNotice ? (
            <p
              className={
                schemaNotice.ok
                  ? "mt-2 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-200"
                  : "mt-2 rounded-lg border border-error/30 bg-error-container/15 px-3 py-2 text-xs text-on-error-container"
              }
            >
              {schemaNotice.text}
            </p>
          ) : null}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={schemaPending}
              onClick={() => {
                setSchemaNotice(null);
                startSchema(async () => {
                  const r = await actionEnsureProjectsSchema();
                  setSchemaNotice({ text: r.message, ok: r.ok });
                });
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-line-field bg-surface-container-high px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-primary-container transition hover:bg-surface-container-highest disabled:opacity-50"
            >
              {schemaPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wrench className="h-4 w-4" />
              )}
              Garantir atributos (projetos)
            </button>
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg bg-gradient-to-r from-primary-dim to-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-on-primary-container shadow-glow-primary hover:opacity-95">
              <input
                type="file"
                accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) void parseFile(f);
                  e.target.value = "";
                }}
              />
              Upload Excel
            </label>
            <button
              type="button"
              disabled={schemaPending || clearing}
              onClick={() => {
                if (clearing) return;
                setError(null);
                setMessage(null);
                setClearConfirmOpen(true);
              }}
              className="inline-flex items-center gap-2 rounded-lg border border-error/40 bg-surface-container-high px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-on-error-container transition hover:bg-error-container/20 disabled:opacity-50"
            >
              {clearing ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              Limpar base do sistema
            </button>
            {loading ? (
              <span className="inline-flex items-center gap-2 text-sm text-on-surface-variant">
                <Loader2 className="h-4 w-4 animate-spin" /> Processando…
              </span>
            ) : null}
          </div>
        </div>
      </div>

      {error ? (
        <p className="mb-4 rounded-lg border border-error/30 bg-error-container/15 px-3 py-2 text-sm text-on-error-container">
          {error}
        </p>
      ) : null}
      {message ? (
        <p className="mb-4 rounded-lg border border-emerald-500/25 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-200">
          {message}
        </p>
      ) : null}

      {clearConfirmOpen ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="clear-base-title"
        >
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            onClick={() => {
              if (!clearing) setClearConfirmOpen(false);
            }}
            disabled={clearing}
            aria-label="Fechar"
          />
          <div className="ui-surface-raised relative z-10 w-full max-w-md p-6 shadow-[0_24px_64px_rgba(0,0,0,0.45)]">
            <h3
              id="clear-base-title"
              className="font-headline text-lg font-bold text-on-surface"
            >
              Limpar toda a base de projetos?
            </h3>
            <p className="mt-2 text-sm text-on-surface-variant">
              Todos os <strong>projetos</strong> serão apagados no Appwrite, e o{" "}
              <strong>histórico de importações Excel</strong> também, para que
              você possa fazer uma nova carga. Isso <strong>não</strong> remove
              usuários, acessos, parâmetros do sistema nem tabela de status.
            </p>
            <p className="mt-2 text-sm font-semibold text-error/90">
              Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <button
                type="button"
                disabled={clearing}
                onClick={() => setClearConfirmOpen(false)}
                className="rounded-lg border border-line-field px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high disabled:opacity-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={clearing}
                onClick={() => void confirmClearBase()}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-error-container px-4 py-2 text-sm font-bold text-on-error-container hover:opacity-95 disabled:opacity-50"
              >
                {clearing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
                Sim, limpar base
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {projects && projects.length ? (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <StatPill label="Total de projetos" value={String(sum?.total ?? 0)} />
            <StatPill
              label="Com data início"
              value={String(sum?.withStart ?? 0)}
            />
            <StatPill
              label="Com data fim"
              value={String(sum?.withEnd ?? 0)}
            />
            <StatPill
              label="Sem datas"
              value={String(sum?.withoutAny ?? 0)}
            />
          </div>
          {issues.length ? (
            <div className="max-h-32 overflow-y-auto rounded-lg border border-amber-500/35 bg-surface-container-high p-3 text-xs text-on-surface">
              <p className="font-bold">Alertas</p>
              <ul className="mt-1 list-inside list-disc">
                {issues.slice(0, 40).map((it, i) => (
                  <li key={`${it.rowIndex}-${i}`}>
                    Linha {it.rowIndex}: {it.message}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="overflow-x-auto rounded-xl border border-line-subtle">
            <table className="w-full min-w-[640px] text-left text-xs">
              <thead className="bg-surface-container-high/95 text-[10px] font-bold uppercase tracking-wider text-outline">
                <tr>
                  <th className="px-3 py-2">Projeto</th>
                  <th className="px-3 py-2">Área</th>
                  <th className="px-3 py-2">Status</th>
                  <th className="px-3 py-2">Início</th>
                  <th className="px-3 py-2">Fim</th>
                  <th className="px-3 py-2">Horas R/P</th>
                </tr>
              </thead>
              <tbody>
                {projects.slice(0, 25).map((p) => (
                  <tr
                    key={p.id}
                    className="border-t border-line-subtle/50"
                  >
                    <td className="px-3 py-2 font-medium text-on-surface">
                      {p.name}
                    </td>
                    <td className="px-3 py-2 text-on-surface-variant">
                      {p.area || "—"}
                    </td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2">{p.startDate ?? "—"}</td>
                    <td className="px-3 py-2">{p.endDate ?? "—"}</td>
                    <td className="px-3 py-2 font-mono">
                      {p.actualHours}/{p.plannedHours}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {projects.length > 25 ? (
              <p className="border-t border-line-subtle/50 px-3 py-2 text-[10px] text-on-surface-variant">
                Mostrando 25 de {projects.length} linhas no preview.
              </p>
            ) : null}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase text-outline">
                Modo de importação
              </p>
              <p className="mt-1 max-w-md rounded-lg border border-line-field/80 bg-surface-container-low/80 px-3 py-2 text-sm text-on-surface">
                Substituir a base atual
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setProjects(null);
                  setFileLabel(null);
                  setMessage(null);
                  setError(null);
                }}
                className="rounded-lg border border-line-field px-4 py-2 text-sm font-semibold text-on-surface hover:bg-surface-container-high"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={importing}
                onClick={() => void confirmImport()}
                className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
              >
                {importing ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : null}
                Confirmar importação
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <div className="mt-6 border-t border-line-subtle pt-4">
        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-outline">
          Log de importações recentes
        </p>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px] text-left text-[11px]">
            <thead className="text-[10px] font-bold uppercase text-outline">
              <tr>
                <th className="py-2 pr-2">Data</th>
                <th className="py-2 pr-2">Arquivo</th>
                <th className="py-2 pr-2">Operação</th>
                <th className="py-2">Linhas</th>
              </tr>
            </thead>
            <tbody>
              {importLogs.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="py-3 text-on-surface-variant"
                  >
                    Nenhum registro ainda (persistido no Appwrite após importação
                    bem-sucedida).
                  </td>
                </tr>
              ) : (
                importLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-line-subtle/50"
                  >
                    <td className="py-2 pr-2 text-on-surface-variant">
                      {log.created_at
                        ? new Date(log.created_at).toLocaleString("pt-BR")
                        : "—"}
                    </td>
                    <td className="py-2 pr-2">{log.file_name}</td>
                    <td className="py-2 pr-2">{log.import_type}</td>
                    <td className="py-2">{log.rows_imported}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-line-subtle/80 bg-surface-container-low/95 px-3 py-2 shadow-sm backdrop-blur-sm">
      <p className="text-[10px] font-bold uppercase text-outline">
        {label}
      </p>
      <p className="font-headline text-lg font-bold text-on-surface">
        {value}
      </p>
    </div>
  );
}
