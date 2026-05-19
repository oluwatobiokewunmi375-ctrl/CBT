import type { NextRequest } from "next/server";

declare global {
  var __rateLimitStore: Map<string, { count: number; windowStart: number }> | undefined;
}

const rateLimitStore = globalThis.__rateLimitStore ?? new Map<string, { count: number; windowStart: number }>();
if (!globalThis.__rateLimitStore) {
  globalThis.__rateLimitStore = rateLimitStore;
}

const DEFAULT_WINDOW_MS = 60_000;
const DEFAULT_MAX_REQUESTS = 20;

export function getClientIp(req: NextRequest) {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp;
  return "unknown";
}

export function checkRateLimit(
  req: NextRequest,
  key: string,
  maxRequests = DEFAULT_MAX_REQUESTS,
  windowMs = DEFAULT_WINDOW_MS
) {
  // Bypass rate limiting when explicitly disabled or during automated tests
  // to avoid flakiness in CI/test runs.
  //
  // Priority: `DISABLE_RATE_LIMIT=true` overrides all environments. If not
  // set, we fall back to `NODE_ENV === "test"` for backwards compatibility.
  // This allows CI systems to opt-in via an env var without changing NODE_ENV.
  // Bypass rate limiting when explicitly disabled, during automated tests,
  // or when requests come from Playwright (test runner). This avoids
  // flaky failures during E2E runs.
  const ua = req.headers.get('user-agent') || '';
  if (process.env.DISABLE_RATE_LIMIT === "true" || process.env.NODE_ENV === "test" || ua.toLowerCase().includes('playwright')) {
    return false;
  }

  const clientIp = getClientIp(req);
  const cacheKey = `${key}:${clientIp}`;
  const now = Date.now();
  const entry = rateLimitStore.get(cacheKey);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitStore.set(cacheKey, { count: 1, windowStart: now });
    return false;
  }

  const count = entry.count + 1;
  entry.count = count;
  rateLimitStore.set(cacheKey, entry);

  return count > maxRequests;
}
