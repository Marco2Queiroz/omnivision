import { Account, Client, Databases } from "appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://sfo.cloud.appwrite.io/v1";
const projectId =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "69c9ddd90025ff57dc52";

const client = new Client().setEndpoint(endpoint).setProject(projectId);

const account = new Account(client);
const databases = new Databases(client);

/** Nome do cookie de sessão usado pelo SDK Web (browser). */
export function getAppwriteSessionCookieName(): string {
  return `a_session_${projectId}`;
}

export { client, account, databases, endpoint, projectId };
