"use client";

import {
  actionCreateStatus,
  actionDeleteStatus,
  actionSaveAppSettings,
  actionUpdateStatus,
} from "@/app/(dashboard)/settings/actions";
import type { UiPreferences } from "@/domain/settings/types";
import type { StatusConfigRow } from "@/services/settings-service";
import { Pencil, Settings2, Trash2 } from "lucide-react";
import { type FormEvent, useState } from "react";

const statusFieldClass =
  "rounded-lg border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface";

type AppSettingsForm = {
  hour_value: number;
  capex_formula: string;
  ui_preferences: UiPreferences;
};

type Props = {
  appSettings: AppSettingsForm;
  statusConfigs: StatusConfigRow[];
  pending: boolean;
  startTransition: (cb: () => void) => void;
  onRefresh: () => void;
};

export function SystemParamsSection({
  appSettings,
  statusConfigs,
  pending,
  startTransition,
  onRefresh,
}: Props) {
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#64748b");
  const [newSortOrder, setNewSortOrder] = useState(0);
  const [newIsFinal, setNewIsFinal] = useState(false);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#64748b");
  const [editSortOrder, setEditSortOrder] = useState(0);
  const [editIsFinal, setEditIsFinal] = useState(false);

  function startEdit(s: StatusConfigRow) {
    setEditingId(s.id);
    setEditName(s.name);
    setEditColor(s.color);
    setEditSortOrder(s.sort_order);
    setEditIsFinal(s.is_final);
  }

  function onSubmitNewStatus(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData();
    fd.set("name", newName);
    fd.set("color", newColor);
    fd.set("sort_order", String(newSortOrder));
    if (newIsFinal) fd.set("is_final", "on");
    startTransition(async () => {
      const r = await actionCreateStatus(fd);
      if (r.ok) {
        setNewName("");
        setNewColor("#64748b");
        setNewSortOrder(0);
        setNewIsFinal(false);
        onRefresh();
      }
    });
  }

  function onSaveEdit(documentId: string) {
    const fd = new FormData();
    fd.set("name", editName);
    fd.set("color", editColor);
    fd.set("sort_order", String(editSortOrder));
    if (editIsFinal) fd.set("is_final", "on");
    startTransition(async () => {
      const r = await actionUpdateStatus(documentId, fd);
      if (r.ok) {
        setEditingId(null);
        onRefresh();
      }
    });
  }

  return (
    <section className="ui-surface-raised p-6">
      <div className="mb-4 flex items-start gap-3">
        <div className="rounded-lg border border-primary/30 bg-primary/12 p-2 text-primary shadow-[0_0_20px_rgba(145,171,255,0.12)]">
          <Settings2 className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-headline text-lg font-bold text-on-surface">
            Parametrizações do sistema
          </h2>
        </div>
      </div>

      <form
        action={(fd) => {
          startTransition(async () => {
            const r = await actionSaveAppSettings(fd);
            if (r.ok) onRefresh();
          });
        }}
        className="grid gap-4 md:grid-cols-2"
      >
        <div>
          <label className="text-[10px] font-bold uppercase text-outline">
            Valor hora (R$)
          </label>
          <input
            name="hour_value"
            type="number"
            step="0.01"
            min="0.01"
            defaultValue={appSettings.hour_value}
            className="mt-1 w-full rounded-lg border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface"
          />
        </div>
        <div>
          <label className="text-[10px] font-bold uppercase text-outline">
            Formato de datas (exibição)
          </label>
          <input
            name="date_format"
            defaultValue={appSettings.ui_preferences.dateFormat}
            className="mt-1 w-full rounded-lg border border-line-field bg-surface-container-low px-3 py-2 text-sm text-on-surface"
          />
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-lg bg-gradient-to-r from-primary-dim to-primary px-4 py-2 font-headline text-xs font-bold uppercase tracking-wider text-on-primary-container shadow-glow-primary hover:opacity-95 disabled:opacity-50 md:w-auto"
          >
            Salvar parametrizações
          </button>
        </div>
      </form>

      <div className="mt-8 border-t border-line-subtle pt-6">
        <h3 className="font-headline text-sm font-bold text-on-surface">
          Status de projetos
        </h3>
        <form
          onSubmit={onSubmitNewStatus}
          className="mt-3 grid gap-3 md:grid-cols-5 md:items-end"
        >
          <input
            name="name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Nome"
            className={statusFieldClass}
            autoComplete="off"
          />
          <input
            name="color"
            value={newColor}
            onChange={(e) => setNewColor(e.target.value)}
            type="color"
            className="h-10 w-full cursor-pointer rounded border border-line-field"
          />
          <input
            name="sort_order"
            value={newSortOrder}
            onChange={(e) => setNewSortOrder(Number(e.target.value))}
            type="number"
            placeholder="Ordem"
            className={statusFieldClass}
          />
          <label className="flex items-center gap-2 text-xs text-on-surface-variant">
            <input
              name="is_final"
              type="checkbox"
              checked={newIsFinal}
              onChange={(e) => setNewIsFinal(e.target.checked)}
              className="rounded"
            />
            Status final
          </label>
          <button
            type="submit"
            disabled={pending}
            className="rounded-lg border border-line-field px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-high"
          >
            Adicionar status
          </button>
        </form>
        <ul className="mt-4 space-y-2">
          {statusConfigs.length === 0 ? (
            <li className="text-sm text-on-surface-variant">
              Nenhum status cadastrado (coleção `status_config` no Appwrite).
            </li>
          ) : (
            statusConfigs.map((s) =>
              editingId === s.id ? (
                <li
                  key={s.id}
                  className="rounded-lg border border-line-subtle bg-surface-container-low p-3"
                >
                  <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-6 md:items-end">
                    <input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className={statusFieldClass}
                      autoComplete="off"
                      aria-label="Nome do status"
                    />
                    <input
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      type="color"
                      className="h-10 w-full cursor-pointer rounded border border-line-field"
                      aria-label="Cor do status"
                    />
                    <input
                      value={editSortOrder}
                      onChange={(e) => setEditSortOrder(Number(e.target.value))}
                      type="number"
                      className={statusFieldClass}
                      aria-label="Ordem de exibição"
                    />
                    <label className="flex items-center gap-2 text-xs text-on-surface-variant">
                      <input
                        type="checkbox"
                        checked={editIsFinal}
                        onChange={(e) => setEditIsFinal(e.target.checked)}
                        className="rounded"
                      />
                      Status final
                    </label>
                    <div className="flex flex-wrap gap-2 sm:col-span-2 md:col-span-2 lg:col-span-2">
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => onSaveEdit(s.id)}
                        className="rounded-lg border border-line-field bg-primary/15 px-3 py-2 text-xs font-bold uppercase tracking-wider text-primary transition hover:bg-primary/25"
                      >
                        Salvar
                      </button>
                      <button
                        type="button"
                        disabled={pending}
                        onClick={() => setEditingId(null)}
                        className="rounded-lg border border-line-field px-3 py-2 text-xs font-bold uppercase tracking-wider text-on-surface hover:bg-surface-container-high"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                </li>
              ) : (
                <li
                  key={s.id}
                  className="flex items-center justify-between gap-2 rounded-lg border border-line-subtle bg-surface-container-low px-3 py-2 text-sm"
                >
                  <span className="flex min-w-0 flex-1 items-center gap-2">
                    <span
                      className="h-3 w-3 shrink-0 rounded-full border border-slate-200"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="truncate">
                      {s.name}{" "}
                      <span className="text-xs text-on-surface-variant">
                        (ordem {s.sort_order}
                        {s.is_final ? ", final" : ""})
                      </span>
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => startEdit(s)}
                      className="rounded p-1.5 text-primary transition hover:bg-surface-container-high"
                      aria-label="Editar status"
                      title="Editar status"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      disabled={pending}
                      onClick={() => {
                        startTransition(async () => {
                          await actionDeleteStatus(s.id);
                          onRefresh();
                        });
                      }}
                      className="rounded p-1.5 text-red-600 hover:bg-surface-container-high hover:text-red-500 dark:text-red-400"
                      aria-label="Remover status"
                      title="Remover status"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </span>
                </li>
              )
            )
          )}
        </ul>
      </div>
    </section>
  );
}
