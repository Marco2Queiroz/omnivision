import { getServerDatabases } from "@/lib/appwrite-server";
import type { PlanoCriseGeo } from "@/types/geo";
import { NextResponse } from "next/server";

export async function GET() {
  const databases = getServerDatabases();
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const collectionId = process.env.APPWRITE_GEO_COLLECTION_ID;

  if (!databases || !databaseId || !collectionId) {
    return NextResponse.json([]);
  }

  try {
    const { documents } = await databases.listDocuments({
      databaseId,
      collectionId,
    });

    const mapped: PlanoCriseGeo[] = documents.map((doc: Record<string, unknown>) => ({
      id: String(doc.$id ?? doc.id ?? ""),
      titulo: String(doc.titulo ?? ""),
      descricao: doc.descricao != null ? String(doc.descricao) : null,
      status: String(doc.status ?? "aberto") as PlanoCriseGeo["status"],
      owner_name: doc.owner_name != null ? String(doc.owner_name) : null,
      created_at: String(doc.$createdAt ?? doc.created_at ?? ""),
      updated_at: String(doc.$updatedAt ?? doc.updated_at ?? ""),
    }));

    return NextResponse.json(mapped);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Erro Appwrite";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
