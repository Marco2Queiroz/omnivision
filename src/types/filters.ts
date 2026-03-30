export type GlobalFilters = {
  /** ISO date string (yyyy-mm-dd) início do intervalo */
  dateFrom: string | null;
  /** ISO date string (yyyy-mm-dd) fim do intervalo */
  dateTo: string | null;
  /** Chave ou nome do projeto Jira */
  projectKey: string | null;
  /** Account ID Jira ou nome para JQL assignee */
  responsibleId: string | null;
};
