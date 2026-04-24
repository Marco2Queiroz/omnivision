"use client";

import {
  GANTT_MONTH_LABELS,
  GANTT_TIMELINE_YEAR,
  effectiveProjectRangeOnGanttTimeline,
  ganttBarPercentLayout,
  ganttTrackMinWidthPx,
  parseProjectIntervalForGantt,
} from "@/lib/gantt-timeline";
import { cn } from "@/lib/utils";
import type { ProjectStatus } from "@/types/project";
import { useMemo } from "react";

/** Fallback quando `trackMinWidthPx` não é passado. */
export const GANTT_TRACK_MIN_PX = 520;

type Props = {
  startDate: string | null;
  endDate: string | null;
  status?: ProjectStatus;
  scrollRef?: React.RefObject<HTMLDivElement>;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  /** Largura mínima da faixa (ex.: n × largura de coluna de mês). */
  trackMinWidthPx?: number;
};

/** Cabeçalho dos 12 meses (Jan–Dez) dentro da coluna Gantt. */
export function GanttFixedMonthStrip() {
  const w = ganttTrackMinWidthPx();
  return (
    <div
      className="flex h-7 w-full text-xs font-headline font-bold uppercase tracking-wider text-on-surface"
      style={{ minWidth: `${w}px`, width: "100%" }}
    >
      {GANTT_MONTH_LABELS.map((label, i) => (
        <div
          key={`${label}-${i}`}
          className="flex min-w-0 flex-1 items-center justify-center px-0.5"
        >
          <span className="truncate leading-tight">{label}</span>
        </div>
      ))}
    </div>
  );
}

function statusBarClass(status?: string): string {
  const s = (status ?? "").toLowerCase();
  if (s.includes("entregue")) return "bg-emerald-500";
  if (s.includes("andamento")) return "bg-primary";
  if (s.includes("negoci")) return "bg-amber-500";
  if (s.includes("backlog")) return "bg-slate-500";
  return "bg-primary-dim";
}

export function ProjectGanttRow({
  startDate,
  endDate,
  status,
  scrollRef,
  onScroll,
  trackMinWidthPx = GANTT_TRACK_MIN_PX,
}: Props) {
  /**
   * Barra proporcional ao intervalo início→fim dentro do ano do Gantt (faixa Jan–Dez),
   * recortado à interseção com o calendário — não preenche meses inteiros por engano.
   */
  const { barLeftPct, barWidthPct, mode, title } = useMemo(() => {
    const interval = parseProjectIntervalForGantt(startDate, endDate);
    if (!interval) {
      return {
        barLeftPct: 0,
        barWidthPct: 0,
        mode: "empty" as const,
        title: "Sem datas",
      };
    }

    const { start, end } = interval;
    const eff = effectiveProjectRangeOnGanttTimeline(start, end);
    if (!eff) {
      return {
        barLeftPct: 0,
        barWidthPct: 0,
        mode: "empty" as const,
        title: `${startDate ?? "—"} → ${endDate ?? "—"} (fora da faixa ${String(GANTT_TIMELINE_YEAR)})`,
      };
    }

    const { leftPct, widthPct } = ganttBarPercentLayout(eff.effStart, eff.effEnd);
    const tip =
      startDate && endDate
        ? `${startDate} → ${endDate}`
        : startDate
          ? `Início: ${startDate}`
          : "Sem datas";
    return {
      barLeftPct: leftPct,
      barWidthPct: widthPct,
      mode: "bar" as const,
      title: tip,
    };
  }, [startDate, endDate]);

  /** Altura da barra: +70% em relação à h-4 base (16px → ~27px). */
  return (
    <div
      ref={scrollRef}
      data-gantt-sync
      onScroll={onScroll}
      className="relative h-10 min-w-[200px] overflow-x-hidden overflow-y-hidden rounded bg-surface-container-low/50"
      title={title}
    >
      <div
        className="relative h-full"
        style={{ minWidth: `${trackMinWidthPx}px`, width: "100%" }}
      >
        {mode === "bar" ? (
          <div
            className={cn(
              "absolute top-1/2 z-[1] h-[1.7rem] min-w-[2px] min-h-[1.7rem] -translate-y-1/2 rounded-sm opacity-95",
              statusBarClass(status),
            )}
            style={{
              left: `${barLeftPct}%`,
              width: `${barWidthPct}%`,
            }}
          />
        ) : null}
      </div>
    </div>
  );
}
