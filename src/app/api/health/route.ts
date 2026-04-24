import { NextResponse } from "next/server";

const startedAt = Date.now();

export async function GET() {
  const isProd = process.env.NODE_ENV === "production";
  if (isProd && process.env.OMNI_VERBOSE_HEALTH !== "true") {
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({
    ok: true,
    service: "omnivision",
    uptimeMs: Date.now() - startedAt,
    appwriteConfigured: Boolean(
      process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT &&
        process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID,
    ),
    appwriteAccessLayerConfigured: Boolean(
      process.env.APPWRITE_API_KEY &&
        process.env.APPWRITE_DATABASE_ID,
    ),
  });
}
