import type { JiraSearchResponse } from "@/types/jira";

export type GetJiraDataOptions = {
  fields?: string[];
  maxResults?: number;
  startAt?: number;
  /** Next-gen search API pagination token (Cloud) */
  nextPageToken?: string;
};

function getJiraAuthHeader(): string {
  const email = process.env.JIRA_EMAIL;
  const token = process.env.JIRA_API_TOKEN;
  if (!email || !token) {
    throw new Error("JIRA_EMAIL ou JIRA_API_TOKEN não configurados.");
  }
  return `Basic ${Buffer.from(`${email}:${token}`).toString("base64")}`;
}

function getJiraHost(): string {
  const host = process.env.JIRA_HOST;
  if (!host) {
    throw new Error("JIRA_HOST não configurado.");
  }
  return host.replace(/\/$/, "");
}

/**
 * Busca issues via Jira REST API v3 (`POST /rest/api/3/search/jql`).
 * Aceita JQL dinâmico para Épicos, Sprints ou Tasks operacionais.
 */
export async function getJiraData(
  jql: string,
  opts: GetJiraDataOptions = {},
): Promise<JiraSearchResponse> {
  const base = getJiraHost();
  const {
    fields = [
      "summary",
      "status",
      "priority",
      "issuetype",
      "assignee",
      "project",
      "updated",
      "created",
    ],
    maxResults = 50,
    startAt = 0,
    nextPageToken,
  } = opts;

  const params = new URLSearchParams();
  params.set("jql", jql);
  params.set("maxResults", String(maxResults));
  if (nextPageToken) {
    params.set("nextPageToken", nextPageToken);
  } else {
    params.set("startAt", String(startAt));
  }
  params.set("fields", fields.join(","));

  const headers = {
    Authorization: getJiraAuthHeader(),
    Accept: "application/json",
    "Content-Type": "application/json",
  };

  let res = await fetch(`${base}/rest/api/3/search/jql?${params.toString()}`, {
    method: "GET",
    headers: { Authorization: headers.Authorization, Accept: "application/json" },
    next: { revalidate: 60 },
  });

  if (!res.ok && (res.status === 404 || res.status === 410)) {
    const body = {
      jql,
      startAt,
      maxResults,
      fields,
    };
    res = await fetch(`${base}/rest/api/3/search`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      next: { revalidate: 60 },
    });
  }

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Jira ${res.status}: ${text.slice(0, 500)}`);
  }

  return res.json() as Promise<JiraSearchResponse>;
}

/** JQL helpers para camadas do plano */
export function buildJqlEpics(filters: {
  projectKey?: string | null;
  dateFrom?: string | null;
  dateTo?: string | null;
  assignee?: string | null;
}): string {
  const parts = ["issuetype = Epic"];
  if (filters.projectKey) {
    parts.push(`project = "${filters.projectKey}"`);
  }
  if (filters.dateFrom) {
    parts.push(`updated >= "${filters.dateFrom}"`);
  }
  if (filters.dateTo) {
    parts.push(`updated <= "${filters.dateTo}"`);
  }
  if (filters.assignee) {
    const a = filters.assignee.replace(/"/g, '\\"');
    parts.push(`assignee = "${a}"`);
  }
  return parts.join(" AND ") + " ORDER BY updated DESC";
}

export function buildJqlOperational(filters: {
  projectKey?: string | null;
  assignee?: string | null;
}): string {
  const parts = [
    '(priority in (Highest, Blocker) OR issuetype = Bug) AND statusCategory != Done',
  ];
  if (filters.projectKey) {
    parts.push(`project = "${filters.projectKey}"`);
  }
  if (filters.assignee) {
    const a = filters.assignee.replace(/"/g, '\\"');
    parts.push(`assignee = "${a}"`);
  }
  return parts.join(" AND ") + " ORDER BY priority DESC, updated DESC";
}

export function buildJqlTactical(filters: {
  projectKey?: string | null;
  sprintId?: string | null;
  assignee?: string | null;
}): string {
  const parts = ["issuetype in (Story, Task, Bug)"];
  if (filters.projectKey) {
    parts.push(`project = "${filters.projectKey}"`);
  }
  if (filters.sprintId) {
    parts.push(`sprint = ${filters.sprintId}`);
  }
  if (filters.assignee) {
    const a = filters.assignee.replace(/"/g, '\\"');
    parts.push(`assignee = "${a}"`);
  }
  return parts.join(" AND ") + " ORDER BY updated DESC";
}
