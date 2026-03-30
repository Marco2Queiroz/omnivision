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
    appwriteConfigured: Boolean(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    ),
    appwriteGeoConfigured: Boolean(
      process.env.APPWRITE_API_KEY &&
        process.env.APPWRITE_DATABASE_ID &&
        process.env.APPWRITE_GEO_COLLECTION_ID,
    ),
  });
}
