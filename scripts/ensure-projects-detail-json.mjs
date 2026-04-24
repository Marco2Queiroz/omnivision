/**
 * Garante o atributo `detail_json` na coleção `projects`.
 * Se o plano Appwrite estiver no limite de atributos, remove (nesta ordem)
 * `updates` e depois `description` — redundantes com o JSON unificado no app.
 *
 * Uso: node scripts/ensure-projects-detail-json.mjs
 * Requer .env.local: APPWRITE_API_KEY, APPWRITE_DATABASE_ID
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client, Databases } from "node-appwrite";

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

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

/** Evita assert do libuv no Windows ao encerrar logo após fetch HTTP (undici). */
async function exitProcess(code) {
  await sleep(300);
  process.exit(code);
}

function attrKey(a) {
  return String(a?.key ?? a?.$id ?? "");
}

function isLimitError(e) {
  const s = e instanceof Error ? e.message : String(e);
  return (
    /attribute_limit|maximum number|maximum.*size/i.test(s) ||
    s.includes("attribute_limit_exceeded")
  );
}

async function listKeys(databases, databaseId, collectionId) {
  const { attributes } = await databases.listAttributes({
    databaseId,
    collectionId,
    total: true,
  });
  return new Map(
    (attributes ?? []).map((a) => [attrKey(a), a]),
  );
}

async function waitAttributeStable(
  databases,
  databaseId,
  collectionId,
  key,
  wantGone,
  timeoutMs = 120_000,
) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const map = await listKeys(databases, databaseId, collectionId);
    const has = map.has(key);
    if (wantGone && !has) return true;
    if (!wantGone && has) {
      const st = String(map.get(key)?.status ?? "");
      if (st === "available") return true;
    }
    await sleep(2000);
  }
  return false;
}

async function main() {
  loadEnvLocal();

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
    console.error("Defina APPWRITE_API_KEY e APPWRITE_DATABASE_ID no .env.local");
    await exitProcess(1);
    return;
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);

  let map = await listKeys(databases, databaseId, collectionId);
  const keys = [...map.keys()].filter(Boolean);
  console.log("Atributos atuais em projects:", keys.join(", ") || "(nenhum)");

  if (map.has("detail_json")) {
    const st = String(map.get("detail_json")?.status ?? "");
    if (st === "available" || !st) {
      console.log("OK: detail_json já existe.");
      await exitProcess(0);
      return;
    }
    console.log("detail_json existe mas status:", st, "— aguardando available…");
    await waitAttributeStable(
      databases,
      databaseId,
      collectionId,
      "detail_json",
      false,
    );
    console.log("OK: detail_json disponível.");
    await exitProcess(0);
    return;
  }

  async function tryCreateDetailJson() {
    const m0 = await listKeys(databases, databaseId, collectionId);
    if (m0.has("detail_json")) {
      const st0 = String(m0.get("detail_json")?.status ?? "");
      if (st0 === "available" || st0 === "") {
        console.log("OK: detail_json já disponível.");
        return;
      }
    }
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: "detail_json",
      size: 20000,
      required: false,
    });
    console.log("Atributo detail_json criado; aguardando ficar available…");
    const ok = await waitAttributeStable(
      databases,
      databaseId,
      collectionId,
      "detail_json",
      false,
    );
    if (!ok) {
      throw new Error("Timeout aguardando detail_json available");
    }
    console.log("OK: detail_json criado e available.");
  }

  try {
    await tryCreateDetailJson();
    await exitProcess(0);
    return;
  } catch (e) {
    if (!isLimitError(e)) {
      console.error("Erro:", e instanceof Error ? e.message : e);
      await exitProcess(1);
      return;
    }
    console.warn(
      "Limite de atributos. Removendo campos legados redundantes (updates → description)…",
    );
  }

  const dropOrder = ["updates", "description"];
  for (const drop of dropOrder) {
    map = await listKeys(databases, databaseId, collectionId);
    if (map.has("detail_json")) {
      console.log("detail_json apareceu entretanto — encerrando.");
      await exitProcess(0);
      return;
    }
    if (!map.has(drop)) {
      console.log(`— atributo "${drop}" não existe, pulando.`);
      continue;
    }
    console.log(`Removendo atributo "${drop}"…`);
    try {
      await databases.deleteAttribute({
        databaseId,
        collectionId,
        key: drop,
      });
    } catch (err) {
      console.error(`Falha ao remover ${drop}:`, err instanceof Error ? err.message : err);
      await exitProcess(1);
      return;
    }
    const gone = await waitAttributeStable(
      databases,
      databaseId,
      collectionId,
      drop,
      true,
      120_000,
    );
    if (!gone) {
      console.warn(
        `Timeout aguardando remoção de "${drop}". Tente de novo em 1–2 min.`,
      );
    } else {
      console.log(`Atributo "${drop}" removido.`);
    }

    try {
      await tryCreateDetailJson();
      await exitProcess(0);
      return;
    } catch (e2) {
      if (!isLimitError(e2)) {
        console.error("Erro ao criar detail_json:", e2 instanceof Error ? e2.message : e2);
        await exitProcess(1);
        return;
      }
      console.warn("Ainda em limite — tentando próximo atributo legado…");
    }
  }

  console.error(
    "Não foi possível liberar slot para detail_json. Remova atributos manualmente no Console Appwrite.",
  );
  await exitProcess(1);
}

main().catch(async (e) => {
  console.error(e);
  await exitProcess(1);
});
