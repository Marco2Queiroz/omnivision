/** Subconjunto tipado da resposta /rest/api/3/search (Jira Cloud) */
export type JiraSearchResponse = {
  startAt: number;
  maxResults: number;
  total: number;
  issues: JiraIssue[];
  nextPageToken?: string;
};

export type JiraIssue = {
  id: string;
  key: string;
  self: string;
  fields: Record<string, unknown>;
};

export type JiraSearchError = {
  errorMessages?: string[];
  errors?: Record<string, string>;
};
