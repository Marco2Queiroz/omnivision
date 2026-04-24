import { Client, Databases, Users } from "node-appwrite";

/**
 * Cliente Appwrite só para rotas de API no servidor (API key).
 * Nunca exponha APPWRITE_API_KEY no cliente.
 */
function getServerClient(): Client | null {
  const key = process.env.APPWRITE_API_KEY;
  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??
    "https://sfo.cloud.appwrite.io/v1";
  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69c9ddd90025ff57dc52";

  if (!key) {
    return null;
  }

  return new Client().setEndpoint(endpoint).setProject(projectId).setKey(key);
}

export function getServerDatabases(): Databases | null {
  const client = getServerClient();
  return client ? new Databases(client) : null;
}

export function getServerUsers(): Users | null {
  const client = getServerClient();
  return client ? new Users(client) : null;
}
