import { Account, Client } from "node-appwrite";
import { cookies, headers } from "next/headers";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ??
  "https://sfo.cloud.appwrite.io/v1";
const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69c9ddd90025ff57dc52";

const SESSION_COOKIE = `a_session_${projectId}`;

export type SessionUser = {
  $id: string;
  email: string;
  name: string;
};

/**
 * Usuário da sessão Appwrite (cookie do SDK web), ou null se não houver sessão válida.
 */
export async function getSessionUser(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const secret = cookieStore.get(SESSION_COOKIE)?.value;
  if (!secret) return null;

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setSession(secret);

  const account = new Account(client);
  try {
    const u = await account.get();
    return {
      $id: u.$id,
      email: u.email,
      name: u.name,
    };
  } catch {
    return null;
  }
}

export async function getRequestHost(): Promise<string | null> {
  const h = await headers();
  return h.get("host");
}
