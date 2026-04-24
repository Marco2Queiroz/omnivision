/**
 * Remove documentos da coleção `projects` em que o atributo `name` está vazio
 * (null, string vazia ou só espaços), alinhado a `mapAppwriteProjectDocument`.
 *
 * Uso:
 *   node scripts/delete-projects-empty-name.mjs --dry-run
 *   node scripts/delete-projects-empty-name.mjs --execute
 *
 * Requer .env.local: APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 * Opcional: APPWRITE_PROJECTS_COLLECTION_ID (padrão: projects)
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client, Databases, Query } from "node-appwrite";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

function loadEnvLocal() {
  const p = path.join(ROOT, ".env.local");
  if (!fs.existsSync(p)) return;
  const text = fs.readFileSync(p, "utf8");
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const i = t.indexOf("=");
    if (i === -1) continue;
    const key = t.slice(0, i).trim();
    let val = t.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = val;
  }
}

function str(v) {
  return typeof v === "string" ? v : v == null ? "" : String(v);
}

function isNameEmpty(doc) {
  return !str(doc.name).trim();
}

const PAGE = 100;

async function main() {
  loadEnvLocal();

  const dryRun = process.argv.includes("--dry-run");
  const execute = process.argv.includes("--execute");

  if (!dryRun && !execute) {
    console.error(
      "Informe --dry-run (apenas listar) ou --execute (apagar de verdade).",
    );
    process.exit(1);
  }

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT?.trim() ||
    "https://sfo.cloud.appwrite.io/v1";
  const projectId =
    process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID?.trim() ||
    "69c9ddd90025ff57dc52";
  const apiKey = process.env.APPWRITE_API_KEY?.trim();
  const databaseId = process.env.APPWRITE_DATABASE_ID?.trim();
  const collectionId =
    process.env.APPWRITE_PROJECTS_COLLECTION_ID?.trim() || "projects";

  if (!apiKey || !databaseId) {
    console.error(
      "APPWRITE_API_KEY e APPWRITE_DATABASE_ID são obrigatórios (.env.local).",
    );
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);

  const candidates = [];
  let lastId = null;

  for (;;) {
    const queries = [
      Query.orderAsc("$id"),
      Query.limit(PAGE),
    ];
    if (lastId) queries.push(Query.cursorAfter(lastId));

    const res = await databases.listDocuments({
      databaseId,
      collectionId,
      queries,
    });

    const docs = res.documents ?? [];
    if (docs.length === 0) break;

    for (const doc of docs) {
      if (isNameEmpty(doc)) {
        candidates.push({ id: doc.$id, name: str(doc.name) });
      }
    }

    if (docs.length < PAGE) break;
    lastId = docs[docs.length - 1].$id;
  }

  console.log(
    `Coleção "${collectionId}" — documentos com nome vazio: ${candidates.length}`,
  );
  if (candidates.length && candidates.length <= 50) {
    for (const c of candidates) {
      console.log(`  - ${c.id} (name=${JSON.stringify(c.name)})`);
    }
  } else if (candidates.length > 50) {
    candidates.slice(0, 20).forEach((c) =>
      console.log(`  - ${c.id} (name=${JSON.stringify(c.name)})`),
    );
    console.log(`  ... e mais ${candidates.length - 20} documento(s).`);
  }

  if (dryRun) {
    console.log("\n[--dry-run] Nenhum documento foi apagado.");
    return;
  }

  let deleted = 0;
  let errors = 0;
  for (const c of candidates) {
    try {
      await databases.deleteDocument({
        databaseId,
        collectionId,
        documentId: c.id,
      });
      deleted += 1;
    } catch (e) {
      errors += 1;
      const msg = e instanceof Error ? e.message : String(e);
      console.error(`Erro ao apagar ${c.id}: ${msg}`);
    }
  }

  console.log(`\nConcluído: ${deleted} apagado(s), ${errors} erro(s).`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
