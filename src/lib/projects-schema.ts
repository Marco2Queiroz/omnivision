import { getAccessDatabaseId } from "@/lib/access-service";
import { getServerDatabases } from "@/lib/appwrite-server";
import { getProjectsCollectionId } from "@/lib/project-appwrite";

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

type AttrLike = { key?: string; status?: string };

function attrKey(a: unknown): string {
  const o = a as Record<string, unknown>;
  return String(o.key ?? o.$id ?? "");
}

function attrStatus(a: unknown): string {
  return String((a as AttrLike).status ?? "");
}

function isLimitError(e: unknown): boolean {
  const raw = e instanceof Error ? e.message : String(e);
  return (
    /attribute_limit|maximum number|maximum.*size/i.test(raw) ||
    raw.includes("attribute_limit_exceeded")
  );
}

function detailJsonAttributeReady(attrs: unknown[]): boolean {
  for (const a of attrs) {
    if (attrKey(a) !== "detail_json") continue;
    const st = attrStatus(a);
    return st === "available" || st === "";
  }
  return false;
}

export type EnsureProjectsResult = {
  ok: boolean;
  message: string;
  /** Quando true, import grava só em `detail_json` (schema sem description/updates). */
  detailJsonReady?: boolean;
};

/**
 * Garante o atributo `detail_json` (JSON com descrição, observações e extras).
 * Se o limite do plano for atingido, remove `updates` e depois `description` (redundantes com o JSON) e tenta de novo.
 */
export async function ensureProjectsCollectionReady(): Promise<EnsureProjectsResult> {
  const databaseId = getAccessDatabaseId();
  const databases = getServerDatabases();
  const collectionId = getProjectsCollectionId();

  if (!databases || !databaseId) {
    return {
      ok: false,
      message:
        "Appwrite não configurado (APPWRITE_API_KEY e APPWRITE_DATABASE_ID).",
    };
  }

  const db = databases;
  const dbId = databaseId;

  try {
    await db.getCollection({ databaseId: dbId, collectionId });
  } catch {
    return {
      ok: false,
      message: `Coleção "${collectionId}" não encontrada. Rode o script npm run appwrite:init ou crie a coleção no Console.`,
    };
  }

  let list;
  try {
    list = await db.listAttributes({
      databaseId: dbId,
      collectionId,
      total: true,
    });
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return {
      ok: false,
      message: `Não foi possível listar atributos da coleção projects: ${msg}`,
    };
  }

  let attrs = (list.attributes ?? []) as unknown[];
  const keys = () => new Set(attrs.map((a) => attrKey(a)).filter(Boolean));

  async function refreshAttrs() {
    const r = await db.listAttributes({
      databaseId: dbId,
      collectionId,
      total: true,
    });
    attrs = (r.attributes ?? []) as unknown[];
  }

  await refreshAttrs();
  if (!keys().has("portfolio_segment")) {
    try {
      await db.createStringAttribute({
        databaseId: dbId,
        collectionId,
        key: "portfolio_segment",
        size: 256,
        required: false,
      });
      await sleep(900);
    } catch {
      /* pode existir ou limite de atributos — segue para validar abaixo */
    }
    const deadline = Date.now() + 120_000;
    while (Date.now() < deadline) {
      await refreshAttrs();
      if (keys().has("portfolio_segment")) {
        const hit = attrs.find((a) => attrKey(a) === "portfolio_segment");
        if (
          hit &&
          (attrStatus(hit) === "available" || attrStatus(hit) === "")
        ) {
          break;
        }
      }
      await sleep(2000);
    }
  }

  async function waitDetailJsonAvailable(timeoutMs = 120_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await refreshAttrs();
      if (detailJsonAttributeReady(attrs)) return true;
      await sleep(2000);
    }
    return false;
  }

  async function waitAttributeGone(key: string, timeoutMs = 120_000): Promise<boolean> {
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      await refreshAttrs();
      if (!keys().has(key)) return true;
      await sleep(2000);
    }
    return false;
  }

  if (detailJsonAttributeReady(attrs)) {
    return {
      ok: true,
      message: `Coleção "${collectionId}": atributo detail_json disponível.`,
      detailJsonReady: true,
    };
  }

  if (keys().has("detail_json")) {
    const ok = await waitDetailJsonAvailable();
    if (!ok) {
      return {
        ok: false,
        message:
          `Atributo detail_json existe mas ainda não está "available" no Appwrite. Aguarde ~1 min e tente novamente.`,
      };
    }
    return {
      ok: true,
      message: `Coleção "${collectionId}": detail_json disponível.`,
      detailJsonReady: true,
    };
  }

  const created: string[] = [];

  const ensureString = async (key: string, size: number) => {
    await refreshAttrs();
    if (keys().has(key)) return;
    await db.createStringAttribute({
      databaseId: dbId,
      collectionId,
      key,
      size,
      required: false,
    });
    created.push(key);
    await sleep(900);
  };

  async function tryCreateDetailJsonOnce(): Promise<void> {
    await ensureString("detail_json", 20000);
  }

  try {
    await tryCreateDetailJsonOnce();
  } catch (e) {
    if (!isLimitError(e)) {
      const raw = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        message: `Falha ao criar atributo detail_json em projects: ${raw}`,
      };
    }

    const dropOrder = ["updates", "description"] as const;
    for (const drop of dropOrder) {
      await refreshAttrs();
      if (detailJsonAttributeReady(attrs)) break;
      if (!keys().has(drop)) continue;
      try {
        await db.deleteAttribute({
          databaseId: dbId,
          collectionId,
          key: drop,
        });
      } catch (delErr) {
        const msg = delErr instanceof Error ? delErr.message : String(delErr);
        return {
          ok: false,
          message: `Limite de atributos: não foi possível remover "${drop}" para liberar slot. ${msg}`,
        };
      }
      await waitAttributeGone(drop);
      try {
        await tryCreateDetailJsonOnce();
        break;
      } catch (e2) {
        if (!isLimitError(e2)) {
          const raw = e2 instanceof Error ? e2.message : String(e2);
          return {
            ok: false,
            message: `Falha ao criar detail_json após remover legados: ${raw}`,
          };
        }
      }
    }

    await refreshAttrs();
    if (!keys().has("detail_json")) {
      const raw = e instanceof Error ? e.message : String(e);
      return {
        ok: false,
        message:
          "Limite de atributos: não foi possível liberar slot para detail_json. " +
          "Remova atributos manualmente no Console (Database → projects → Attributes) ou rode: npm run appwrite:ensure-detail-json. " +
          `Detalhe: ${raw}`,
      };
    }
  }

  const pending = created.filter((k) => k.length > 0);
  if (pending.length > 0) {
    const deadline = Date.now() + 120_000;
    for (const key of pending) {
      let ready = false;
      while (Date.now() < deadline) {
        try {
          const a = await db.getAttribute({
            databaseId: dbId,
            collectionId,
            key,
          });
          if (attrStatus(a) === "available") {
            ready = true;
            break;
          }
        } catch {
          /* ainda processando */
        }
        await sleep(2000);
      }
      if (!ready) {
        return {
          ok: false,
          message: `Atributo "${key}" criado mas ainda não está "available" no Appwrite. Aguarde ~1 min e tente novamente.`,
        };
      }
    }
  }

  await refreshAttrs();
  const ready = detailJsonAttributeReady(attrs);
  if (!ready) {
    return {
      ok: false,
      message:
        "O atributo detail_json não ficou disponível após a criação. Aguarde 1–2 minutos e use «Garantir atributos» novamente.",
    };
  }

  if (created.length === 0) {
    return {
      ok: true,
      message: `Coleção "${collectionId}": atributos necessários já existem.`,
      detailJsonReady: true,
    };
  }

  return {
    ok: true,
    message: `Coleção "${collectionId}": criados atributos ${created.join(", ")}.`,
    detailJsonReady: true,
  };
}
