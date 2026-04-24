export type GlobalFilters = {
  /** ISO date string (yyyy-mm-dd) início do intervalo */
  dateFrom: string | null;
  /** ISO date string (yyyy-mm-dd) fim do intervalo */
  dateTo: string | null;
  /** Filtro por projeto / frente (ex.: código ou nome) */
  projectKey: string | null;
  /** Filtro por responsável (e-mail, nome ou ID interno) */
  responsibleId: string | null;
};
