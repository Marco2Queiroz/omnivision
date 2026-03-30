import { NextResponse } from "next/server";

const startedAt = Date.now();

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "omnivision",
    uptimeMs: Date.now() - startedAt,
    jiraConfigured: Boolean(
      process.env.JIRA_HOST &&
        process.env.JIRA_EMAIL &&
        process.env.JIRA_API_TOKEN,
    ),
    supabaseConfigured: Boolean(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    ),
  });
}
