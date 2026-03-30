import { NextRequest, NextResponse } from "next/server";
import { getJiraData } from "@/services/jira";

export async function GET(request: NextRequest) {
  const jql = request.nextUrl.searchParams.get("jql");
  if (!jql?.trim()) {
    return NextResponse.json(
      { error: "Parâmetro jql é obrigatório." },
      { status: 400 },
    );
  }

  const maxResults = Math.min(
    Number(request.nextUrl.searchParams.get("maxResults") ?? 50) || 50,
    100,
  );
  const startAt = Number(request.nextUrl.searchParams.get("startAt") ?? 0) || 0;

  try {
    const data = await getJiraData(jql, { maxResults, startAt });
    return NextResponse.json(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro desconhecido";
    return NextResponse.json(
      { error: "Falha ao consultar o Jira.", detail: message },
      { status: 503 },
    );
  }
}
