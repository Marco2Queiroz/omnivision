const DEFAULT = "/dashboard";

/**
 * Anula open redirect pós-login: só path relativo (mesma origem), nunca
 * `//`, `\\`, outro *scheme* ou URLs absolutas.
 */
export function getSafeNextPath(raw: string | null | undefined): string {
  if (raw == null || raw === "") return DEFAULT;
  const t = raw.trim();
  if (!t.startsWith("/") || t.startsWith("//") || t.includes("://")) {
    return DEFAULT;
  }
  if (t.includes("\0") || t.includes("\\")) {
    return DEFAULT;
  }
  if (t.startsWith("/\\") || t.toLowerCase().includes("/%2e")) {
    return DEFAULT;
  }
  return t;
}
