/**
 * Cria coleções OmniVision no Appwrite com atributos alinhados ao código (src/lib/project-appwrite,
 * access-service, settings-service, import-logs-service) e opcionalmente documentos iniciais.
 *
 * Coleção `projects`: texto corrido em `detail_json` (JSON { description, updates }) para caber em
 * planos com limite de atributos por coleção; o app também aceita documentos legados com
 * `description` / `updates` separados.
 *
 * Uso (na raiz do projeto):
 *   npm run appwrite:init
 *   node scripts/init-appwrite-collections.mjs --no-seed
 *   node scripts/init-appwrite-collections.mjs --demo-projects
 *
 * Requer .env.local com: APPWRITE_API_KEY, APPWRITE_DATABASE_ID,
 * NEXT_PUBLIC_APPWRITE_ENDPOINT, NEXT_PUBLIC_APPWRITE_PROJECT_ID
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Client, Databases, ID, Permission, Query, Role } from "node-appwrite";

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

const argv = process.argv.slice(2);
const wantSeed = !argv.includes("--no-seed");
const wantDemoProjects = argv.includes("--demo-projects");

const COLLECTION_PERMS = [
  Permission.read(Role.users()),
  Permission.create(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

const DOC_READ_UPDATE = [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
];

const DOC_READ_UPDATE_DELETE = [
  Permission.read(Role.users()),
  Permission.update(Role.users()),
  Permission.delete(Role.users()),
];

async function collectionExists(databases, databaseId, collectionId) {
  try {
    await databases.getCollection({ databaseId, collectionId });
    return true;
  } catch {
    return false;
  }
}

async function waitAttributesAvailable(
  databases,
  databaseId,
  collectionId,
  keys,
  timeoutMs = 180_000,
) {
  const need = new Set(keys);
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    const { attributes } = await databases.listAttributes({
      databaseId,
      collectionId,
      total: true,
    });
    const map = new Map(attributes.map((a) => [a.key, a.status]));
    const pending = [...need].filter((k) => map.get(k) !== "available");
    if (pending.length === 0) return;
    await sleep(1500);
  }
  throw new Error(
    `Timeout: atributos não ficaram "available" a tempo em ${collectionId}. Veja o Console Appwrite.`,
  );
}

async function createCollectionIfMissing(
  databases,
  databaseId,
  collectionId,
  name,
) {
  if (await collectionExists(databases, databaseId, collectionId)) {
    console.log(`⊗ Coleção "${collectionId}" já existe — pulando criação/atributos.`);
    return false;
  }
  await databases.createCollection({
    databaseId,
    collectionId,
    name,
    documentSecurity: false,
    permissions: COLLECTION_PERMS,
  });
  console.log(`✓ Coleção "${collectionId}" criada.`);
  return true;
}

/** @param {{ key: string, size: number, required?: boolean }[]} defs */
async function addStringAttrs(databases, databaseId, collectionId, defs, delayMs) {
  for (const d of defs) {
    await databases.createStringAttribute({
      databaseId,
      collectionId,
      key: d.key,
      size: d.size,
      required: d.required ?? false,
    });
    await sleep(delayMs);
  }
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

  if (!apiKey || !databaseId) {
    console.error(
      "Defina APPWRITE_API_KEY e APPWRITE_DATABASE_ID no .env.local (endpoint/projeto usam o mesmo padrão do app se NEXT_PUBLIC_* estiver vazio).",
    );
    process.exit(1);
  }

  const client = new Client()
    .setEndpoint(endpoint)
    .setProject(projectId)
    .setKey(apiKey);
  const databases = new Databases(client);

  const delay = 900;

  // --- access_profiles (access-service + mapDoc: area, allowed_tabs, auth_provider)
  const accessId = "access_profiles";
  if (
    await createCollectionIfMissing(
      databases,
      databaseId,
      accessId,
      "Gestão de acesso",
    )
  ) {
    await addStringAttrs(
      databases,
      databaseId,
      accessId,
      [
        { key: "user_id", size: 36, required: true },
        { key: "email", size: 320, required: true },
        { key: "name", size: 128, required: false },
        { key: "role", size: 32, required: true },
        { key: "area", size: 128, required: false },
        { key: "allowed_tabs", size: 4096, required: false },
        { key: "auth_provider", size: 32, required: false },
      ],
      delay,
    );
    await databases.createBooleanAttribute({
      databaseId,
      collectionId: accessId,
      key: "active",
      required: false,
      xdefault: true,
    });
    await sleep(delay);
    await waitAttributesAvailable(databases, databaseId, accessId, [
      "user_id",
      "email",
      "name",
      "role",
      "area",
      "allowed_tabs",
      "auth_provider",
      "active",
    ]);
  }

  // --- projects (mapAppwriteProjectDocument + excel-import)
  const projectsId = "projects";
  if (
    await createCollectionIfMissing(
      databases,
      databaseId,
      projectsId,
      "Projetos",
    )
  ) {
    await addStringAttrs(
      databases,
      databaseId,
      projectsId,
      [
        { key: "name", size: 512, required: true },
        { key: "category", size: 256, required: false },
        { key: "portfolio_segment", size: 256, required: false },
        { key: "area", size: 256, required: false },
        { key: "sponsor", size: 256, required: false },
        { key: "status", size: 64, required: false },
        { key: "startDate", size: 32, required: false },
        { key: "endDate", size: 32, required: false },
      ],
      delay,
    );
    for (const key of ["plannedHours", "actualHours", "capex"]) {
      await databases.createFloatAttribute({
        databaseId,
        collectionId: projectsId,
        key,
        required: false,
        xdefault: 0,
      });
      await sleep(delay);
    }
    /* Um único JSON (description + updates) para respeitar limite de atributos/coleção em planos menores. */
    await databases.createStringAttribute({
      databaseId,
      collectionId: projectsId,
      key: "detail_json",
      size: 20000,
      required: false,
    });
    await sleep(delay);
    await waitAttributesAvailable(databases, databaseId, projectsId, [
      "name",
      "category",
      "portfolio_segment",
      "area",
      "sponsor",
      "status",
      "startDate",
      "endDate",
      "plannedHours",
      "actualHours",
      "capex",
      "detail_json",
    ]);
  }

  // --- app_settings (singleton default)
  const appSettingsId = "app_settings";
  if (
    await createCollectionIfMissing(
      databases,
      databaseId,
      appSettingsId,
      "Parâmetros da aplicação",
    )
  ) {
    await databases.createFloatAttribute({
      databaseId,
      collectionId: appSettingsId,
      key: "hour_value",
      required: true,
    });
    await sleep(delay);
    await databases.createStringAttribute({
      databaseId,
      collectionId: appSettingsId,
      key: "capex_formula",
      size: 32,
      required: true,
    });
    await sleep(delay);
    await databases.createStringAttribute({
      databaseId,
      collectionId: appSettingsId,
      key: "ui_preferences",
      size: 8192,
      required: false,
    });
    await sleep(delay);
    await waitAttributesAvailable(databases, databaseId, appSettingsId, [
      "hour_value",
      "capex_formula",
      "ui_preferences",
    ]);
  }

  // --- status_config
  const statusId = "status_config";
  if (
    await createCollectionIfMissing(
      databases,
      databaseId,
      statusId,
      "Status (configurável)",
    )
  ) {
    await addStringAttrs(
      databases,
      databaseId,
      statusId,
      [
        { key: "name", size: 128, required: true },
        { key: "color", size: 32, required: true },
      ],
      delay,
    );
    await databases.createIntegerAttribute({
      databaseId,
      collectionId: statusId,
      key: "sort_order",
      required: true,
    });
    await sleep(delay);
    await databases.createBooleanAttribute({
      databaseId,
      collectionId: statusId,
      key: "is_final",
      required: false,
      xdefault: false,
    });
    await sleep(delay);
    await waitAttributesAvailable(databases, databaseId, statusId, [
      "name",
      "color",
      "sort_order",
      "is_final",
    ]);
  }

  // --- import_logs
  const logsId = "import_logs";
  if (
    await createCollectionIfMissing(
      databases,
      databaseId,
      logsId,
      "Histórico de importações",
    )
  ) {
    await addStringAttrs(
      databases,
      databaseId,
      logsId,
      [
        { key: "user_id", size: 36, required: true },
        { key: "file_name", size: 512, required: true },
        { key: "import_type", size: 16, required: true },
      ],
      delay,
    );
    await databases.createIntegerAttribute({
      databaseId,
      collectionId: logsId,
      key: "rows_imported",
      required: true,
    });
    await sleep(delay);
    await waitAttributesAvailable(databases, databaseId, logsId, [
      "user_id",
      "file_name",
      "import_type",
      "rows_imported",
    ]);
  }

  if (!wantSeed) {
    console.log("\nConcluído (sem seed de documentos).");
    return;
  }

  // --- Seed: app_settings default
  const settingsDocId = process.env.APPWRITE_APP_SETTINGS_DOC_ID?.trim() || "default";
  if (await collectionExists(databases, databaseId, appSettingsId)) {
    try {
      await databases.getDocument({
        databaseId,
        collectionId: appSettingsId,
        documentId: settingsDocId,
      });
      console.log(`⊗ Documento app_settings/${settingsDocId} já existe.`);
    } catch {
      try {
        await databases.createDocument({
          databaseId,
          collectionId: appSettingsId,
          documentId: settingsDocId,
          data: {
            hour_value: 150,
            capex_formula: "actual_hours",
            ui_preferences: JSON.stringify({
              dateFormat: "dd/MM/yyyy",
              pageSize: 25,
            }),
          },
          permissions: DOC_READ_UPDATE,
        });
        console.log(`✓ Documento app_settings/${settingsDocId} criado.`);
      } catch (e) {
        console.warn(
          "Não foi possível criar app_settings/default:",
          e instanceof Error ? e.message : e,
        );
      }
    }
  }

  // --- Seed: status_config (se coleção vazia)
  if (await collectionExists(databases, databaseId, statusId)) {
    const statusList = await databases.listDocuments({
      databaseId,
      collectionId: statusId,
      queries: [Query.limit(1)],
      total: true,
    });
    if (statusList.total === 0) {
      const rows = [
        { name: "Backlog", color: "#64748b", sort_order: 0, is_final: false },
        { name: "Em negociação", color: "#f59e0b", sort_order: 1, is_final: false },
        { name: "Em andamento", color: "#3b82f6", sort_order: 2, is_final: false },
        { name: "Concluído", color: "#22c55e", sort_order: 99, is_final: true },
      ];
      for (const r of rows) {
        await databases.createDocument({
          databaseId,
          collectionId: statusId,
          documentId: ID.unique(),
          data: r,
          permissions: DOC_READ_UPDATE_DELETE,
        });
      }
      console.log("✓ Status iniciais (4 documentos) criados em status_config.");
    } else {
      console.log("⊗ status_config já possui documentos — seed de status ignorado.");
    }
  }

  // --- Opcional: projetos demo (mesmo conteúdo conceitual de src/lib/mock-projects.ts)
  if (wantDemoProjects && (await collectionExists(databases, databaseId, projectsId))) {
    const projList = await databases.listDocuments({
      databaseId,
      collectionId: projectsId,
      queries: [Query.limit(1)],
      total: true,
    });
    if (projList.total === 0) {
      const demo = [
        {
          name: "Modernização do data lake",
          category: "Projetos Estruturantes",
          area: "Dados",
          sponsor: "Diretoria TI",
          status: "em_andamento",
          startDate: "2025-06-01",
          endDate: "2026-03-31",
          plannedHours: 2000,
          actualHours: 1567,
          capex: 0,
          detail_json: JSON.stringify({
            description:
              "Consolidação de fontes e camada de consumo analítico para áreas de negócio.",
            updates: "Sprint 12: integração com catálogo concluída.",
          }),
        },
        {
          name: "Portal de fornecedores",
          category: "Projetos",
          area: "Field Service",
          sponsor: "Operações",
          status: "em_negociacao",
          startDate: "2026-01-15",
          endDate: "",
          plannedHours: 800,
          actualHours: 120,
          capex: 0,
          detail_json: JSON.stringify({
            description: "Autosserviço para ordens e SLA.",
            updates: "Aguardando fechamento de escopo com jurídico.",
          }),
        },
        {
          name: "Hardening SOC",
          category: "Projetos",
          area: "Segurança da Informação",
          sponsor: "CISO",
          status: "backlog",
          startDate: "",
          endDate: "",
          plannedHours: 400,
          actualHours: 0,
          capex: 0,
          detail_json: JSON.stringify({
            description: "Playbooks e correlação de alertas.",
            updates: "",
          }),
        },
      ];
      for (const p of demo) {
        await databases.createDocument({
          databaseId,
          collectionId: projectsId,
          documentId: ID.unique(),
          data: p,
          permissions: DOC_READ_UPDATE_DELETE,
        });
      }
      console.log("✓ 3 projetos demo inseridos em projects.");
    } else {
      console.log("⊗ projects já possui documentos — --demo-projects ignorado.");
    }
  }

  console.log("\nPronto. Índices: no Console, crie índices em `projects` para `area` e `category` se usar filtros em escala.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
