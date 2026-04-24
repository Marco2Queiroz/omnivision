import type { ProjectRecord } from "@/types/project";

/**
 * CAPEX = horas × valor hora (padrão). Sem eval — extensível com mapa de variáveis.
 */
export type CapexInput = {
  actualHours: number;
  plannedHours: number;
  hourValue: number;
  /** "actual" | "planned" — qual campo de horas usar */
  hoursField?: "actual" | "planned";
};

export function computeCapexSimple(input: CapexInput): number {
  const h =
    input.hoursField === "planned"
      ? input.plannedHours
      : input.actualHours;
  return Math.round(h * input.hourValue * 100) / 100;
}

/**
 * Valor (R$) = horas × valor hora (parametrização). Prioriza **horas estimadas**
 * (planejadas); se zero, usa horas reais. Só usa `capex` importado quando
 * ambas as horas forem zero.
 */
/** Exibição em tabela (R$ com máscara pt-BR). */
export function formatBrl(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export function projectCapexDisplay(
  p: ProjectRecord,
  hourValue: number,
): number {
  if (p.plannedHours > 0) {
    return computeCapexSimple({
      actualHours: p.actualHours,
      plannedHours: p.plannedHours,
      hourValue,
      hoursField: "planned",
    });
  }
  if (p.actualHours > 0) {
    return computeCapexSimple({
      actualHours: p.actualHours,
      plannedHours: p.plannedHours,
      hourValue,
      hoursField: "actual",
    });
  }
  if (p.capex > 0) return p.capex;
  return 0;
}
