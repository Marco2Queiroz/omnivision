import { getServerDatabases, getServerUsers } from "@/lib/appwrite-server";
import type { AccessProfileDoc, AccessRole } from "@/types/access";
import { parseAccessRole, parseAllowedTabs } from "@/types/access";
import { ID, Permission, Query, Role } from "node-appwrite";

const DEFAULT_COLLECTION = "access_profiles";

/** ID da coleção de perfis (mesmo valor do Console Appwrite). */
export function getAccessCollectionId(): string {
  const id = process.env.APPWRITE_ACCESS_COLLECTION_ID?.trim();
  return id || DEFAULT_COLLECTION;
}

export function getAccessDatabaseId(): string | undefined {
  return process.env.APPWRITE_DATABASE_ID?.trim() || undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export function isAccessLayerConfigured(): boolean {
  return Boolean(
    process.env.APPWRITE_API_KEY &&
      getAccessDatabaseId() &&
      getAccessCollectionId(),
  );
}

/** Cria coleção + atributos no Appwrite (rode uma vez; atributos podem levar ~1 min). */
export async function initAccessCollection(): Promise<{
  ok: boolean;
  message: string;
}> {
  const databaseId = getAccessDatabaseId();
  const databases = getServerDatabases();
  if (!databases) {
    return { ok: false, message: "APPWRITE_API_KEY ausente." };
  }
  if (!databaseId) {
    return {
      ok: false,
      message:
        "Defina APPWRITE_DATABASE_ID (crie um banco no Console Appwrite e cole o ID).",
    };
  }

  const collectionId = getAccessCollectionId();

  try {
    await databases.getCollection({ databaseId, collectionId });
    return { ok: true, message: `Coleção "${collectionId}" já existe.` };
  } catch {
    /* criar */
  }

  try {
    await databases.createCollection({
      databaseId,
      collectionId,
      name: "Gestão de acesso",
      documentSecurity: false,
      permissions: [
        Permission.read(Role.users()),
        Permission.create(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    });
    await sleep(2000);

    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: "user_id",
      size: 36,
      required: true,
    });
    await sleep(1500);
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: "email",
      size: 320,
      required: true,
    });
    await sleep(1500);
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: "name",
      size: 128,
      required: false,
    });
    await sleep(1500);
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: "role",
      size: 32,
      required: true,
    });
    await sleep(1500);
    await databases.createBooleanAttribute({
      databaseId,
      collectionId,
      key: "active",
      required: false,
      xdefault: true,
    });
    await sleep(1500);

    return {
      ok: true,
      message:
        "Coleção criada. Aguarde até os atributos ficarem “available” no Console e então cadastre usuários.",
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, message: msg };
  }
}

function mapDoc(doc: Record<string, unknown>): AccessProfileDoc {
  return {
    id: String(doc.$id ?? ""),
    user_id: String(doc.user_id ?? ""),
    email: String(doc.email ?? ""),
    name: String(doc.name ?? ""),
    role: parseAccessRole(String(doc.role ?? "")),
    active: Boolean(doc.active ?? true),
    area: String(doc.area ?? ""),
    allowed_tabs: parseAllowedTabs(doc.allowed_tabs),
    auth_provider: String(doc.auth_provider ?? "email") || "email",
    created_at: String(doc.$createdAt ?? ""),
    updated_at: String(doc.$updatedAt ?? ""),
  };
}

export async function getAccessProfileByUserId(
  userId: string,
): Promise<AccessProfileDoc | null> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAccessCollectionId();
  if (!databases || !databaseId || !userId) {
    return null;
  }
  try {
    const { documents } = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: [Query.equal("user_id", userId), Query.limit(1)],
    });
    const d = documents[0];
    if (!d) return null;
    return mapDoc(d as unknown as Record<string, unknown>);
  } catch {
    return null;
  }
}

export async function listAccessProfiles(): Promise<AccessProfileDoc[]> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAccessCollectionId();
  if (!databases || !databaseId) {
    return [];
  }
  try {
    const { documents } = await databases.listDocuments({
      databaseId,
      collectionId,
      queries: [Query.orderDesc("$createdAt"), Query.limit(200)],
    });
    return documents.map((d) =>
      mapDoc(d as unknown as Record<string, unknown>),
    );
  } catch {
    return [];
  }
}

export async function createUserWithProfile(input: {
  email: string;
  password: string;
  name: string;
  role: AccessRole;
}): Promise<{ ok: true; userId: string } | { ok: false; error: string }> {
  const users = getServerUsers();
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAccessCollectionId();

  if (!users || !databases || !databaseId) {
    return {
      ok: false,
      error:
        "Appwrite não configurado (APPWRITE_API_KEY + APPWRITE_DATABASE_ID).",
    };
  }

  const email = input.email.trim().toLowerCase();
  if (!email || !input.password || input.password.length < 8) {
    return { ok: false, error: "E-mail e senha (mín. 8 caracteres) obrigatórios." };
  }

  try {
    const user = await users.create({
      userId: ID.unique(),
      email,
      password: input.password,
      name: input.name.trim() || email,
    });

    await databases.createDocument({
      databaseId,
      collectionId,
      documentId: ID.unique(),
      data: {
        user_id: user.$id,
        email,
        name: input.name.trim() || email,
        role: input.role,
        active: true,
      },
      permissions: [
        Permission.read(Role.users()),
        Permission.update(Role.users()),
        Permission.delete(Role.users()),
      ],
    });

    return { ok: true, userId: user.$id };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

export async function updateProfileRole(
  documentId: string,
  role: AccessRole,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const databases = getServerDatabases();
  const databaseId = getAccessDatabaseId();
  const collectionId = getAccessCollectionId();
  if (!databases || !databaseId) {
    return { ok: false, error: "Appwrite não configurado." };
  }
  try {
    await databases.updateDocument({
      databaseId,
      collectionId,
      documentId,
      data: { role },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg };
  }
}

/** Usuário local para testes (desenvolvimento / SEED_TEST_USER=true). */
export async function seedTestUserLocal(): Promise<
  { ok: true; email: string } | { ok: false; error: string }
> {
  const allow =
    process.env.NODE_ENV === "development" ||
    process.env.SEED_TEST_USER === "true";
  if (!allow) {
    return {
      ok: false,
      error:
        "Seed só em desenvolvimento ou com SEED_TEST_USER=true no servidor.",
    };
  }

  const email =
    process.env.SEED_TEST_USER_EMAIL?.trim().toLowerCase() ??
    "teste.local@omnivision.local";
  const password =
    process.env.SEED_TEST_USER_PASSWORD ?? "Omnivision2026!";
  const name = process.env.SEED_TEST_USER_NAME ?? "Usuário teste local";

  const r = await createUserWithProfile({
    email,
    password,
    name,
    role: "master",
  });

  if (!r.ok) {
    if (r.error.includes("already exists") || r.error.includes("409")) {
      return { ok: true, email };
    }
    return { ok: false, error: r.error };
  }
  return { ok: true, email };
}
