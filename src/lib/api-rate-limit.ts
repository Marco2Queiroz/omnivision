/**
 * Rate limit em memória por processo (adequado a um nó; em serverless
 * horizonte use Redis/Upstash). Afinar com OMNI_API_RATE_MAX / WINDOW_MS.
 */

const buckets = new Map<string, { count: number; at: number }>();

function getWindowConfig() {
  const max = (() => {
    const s = process.env.OMNI_API_RATE_MAX;
    if (s && /^\d+$/.test(s)) return Math.max(1, parseInt(s, 10));
    return 60;
  })();
  const windowMs = (() => {
    const s = process.env.OMNI_API_RATE_WINDOW_MS;
    if (s && /^\d+$/.test(s)) return Math.max(1_000, parseInt(s, 10));
    return 60_000;
  })();
  return { max, windowMs };
}

export function getClientIp(headers: Headers): string {
  const xff = headers.get("x-forwarded-for");
  if (xff) {
    return xff.split(",")[0]?.trim() || "0";
  }
  return headers.get("x-real-ip") || "0";
}

export function checkApiRateLimit(
  ip: string,
  routeKey: string,
): { allowed: true } | { allowed: false; retryAfterSec: number } {
  const { max, windowMs } = getWindowConfig();
  const k = `${ip}::${routeKey}`;
  const now = Date.now();
  const b = buckets.get(k);
  if (!b || now - b.at > windowMs) {
    buckets.set(k, { count: 1, at: now });
    return { allowed: true };
  }
  b.count += 1;
  if (b.count > max) {
    return { allowed: false, retryAfterSec: Math.ceil((windowMs - (now - b.at)) / 1000) || 60 };
  }
  return { allowed: true };
}
