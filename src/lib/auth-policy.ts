/**
 * Mesma política de [middleware.ts](middleware.ts) para uso em Server Components.
 */
export function isLocalHost(host: string | null): boolean {
  if (!host) return false;
  const h = host.split(":")[0]?.toLowerCase() ?? "";
  return h === "localhost" || h === "127.0.0.1" || h === "[::1]";
}

export function shouldSkipAuthServer(host: string | null): boolean {
  if (process.env.FORCE_LOGIN === "true") return false;
  if (
    process.env.REQUIRE_AUTH_IN_DEV === "true" ||
    process.env.REQUIRE_AUTH === "true"
  ) {
    return false;
  }
  if (process.env.NODE_ENV === "production") {
    if (
      process.env.OMNI_ALLOW_BYPASS_IN_PROD === "true" &&
      process.env.OMNI_SKIP_LOGIN === "true"
    ) {
      return true;
    }
    return false;
  }
  if (process.env.OMNI_SKIP_LOGIN === "true") return true;
  if (process.env.NODE_ENV === "development") return true;
  if (isLocalHost(host)) return true;
  return false;
}
