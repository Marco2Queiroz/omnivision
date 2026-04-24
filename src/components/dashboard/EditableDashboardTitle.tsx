"use client";

import type { DashboardTabId } from "@/lib/dashboard-tabs";
import { cn } from "@/lib/utils";
import { Pencil } from "lucide-react";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "omnivision:dashboardTitles:v1";

function readStored(tab: string): string | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Record<string, string>;
    const v = parsed[tab];
    return typeof v === "string" && v.trim() ? v.trim() : null;
  } catch {
    return null;
  }
}

function writeStored(tab: string, value: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    const next = { ...parsed, [tab]: value };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore quota / private mode */
  }
}

function clearStored(tab: string) {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, string>;
    delete parsed[tab];
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
  } catch {
    /* ignore */
  }
}

type Props = {
  tab: DashboardTabId;
  defaultLabel: string;
  className?: string;
  /** Leitor: só exibe o título (sem editar / localStorage). */
  readOnly?: boolean;
};

/**
 * Título da área no corpo do dashboard — editável localmente (localStorage),
 * sem alterar labels das abas do header.
 */
export function EditableDashboardTitle({
  tab,
  defaultLabel,
  className,
  readOnly = false,
}: Props) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [mounted, setMounted] = useState(false);
  const [editing, setEditing] = useState(false);
  const [label, setLabel] = useState(defaultLabel);
  const [draft, setDraft] = useState(defaultLabel);

  useEffect(() => {
    setMounted(true);
    const stored = readStored(tab);
    if (stored) {
      setLabel(stored);
      setDraft(stored);
    } else {
      setLabel(defaultLabel);
      setDraft(defaultLabel);
    }
  }, [tab, defaultLabel]);

  useEffect(() => {
    if (!editing) return;
    inputRef.current?.focus();
    inputRef.current?.select();
  }, [editing]);

  const startEdit = useCallback(() => {
    setDraft(label);
    setEditing(true);
  }, [label]);

  const commit = useCallback(() => {
    const next = draft.trim();
    if (!next) {
      setDraft(defaultLabel);
      setLabel(defaultLabel);
      clearStored(tab);
      setEditing(false);
      return;
    }
    if (next === defaultLabel) {
      setLabel(defaultLabel);
      clearStored(tab);
    } else {
      setLabel(next);
      writeStored(tab, next);
    }
    setEditing(false);
  }, [draft, defaultLabel, tab]);

  const cancel = useCallback(() => {
    setDraft(label);
    setEditing(false);
  }, [label]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      commit();
    }
    if (e.key === "Escape") {
      e.preventDefault();
      cancel();
    }
  };

  const displayLabel = mounted ? label : defaultLabel;

  if (readOnly) {
    return (
      <div
        className={cn(
          "flex min-h-[2.5rem] flex-wrap items-center gap-2",
          className,
        )}
      >
        <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface md:text-2xl">
          {defaultLabel}
        </h1>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[2.5rem] flex-wrap items-center gap-2",
        className,
      )}
    >
      {editing ? (
        <>
          <label htmlFor={inputId} className="sr-only">
            Nome da área
          </label>
          <input
            id={inputId}
            ref={inputRef}
            type="text"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={onKeyDown}
            className="min-w-[12rem] max-w-full rounded-md border border-outline-variant/40 bg-surface-container-low px-3 py-1.5 font-headline text-xl font-bold tracking-tight text-on-surface shadow-sm outline-none ring-primary/30 focus-visible:ring-2 md:text-2xl"
            autoComplete="off"
            maxLength={120}
            aria-label="Editar nome da área"
          />
        </>
      ) : (
        <>
          <h1 className="font-headline text-xl font-bold tracking-tight text-on-surface md:text-2xl">
            {displayLabel}
          </h1>
          <button
            type="button"
            onClick={startEdit}
            className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-on-surface-variant transition hover:bg-surface-container-high hover:text-on-surface"
            aria-label="Editar título da área"
          >
            <Pencil className="h-4 w-4" />
            <span className="hidden text-xs font-medium sm:inline">Editar</span>
          </button>
        </>
      )}
    </div>
  );
}
