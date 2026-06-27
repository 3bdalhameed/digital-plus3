import { NextRequest, NextResponse } from "next/server";

/**
 * Per-IP, per-endpoint rate limiting at the Next.js edge.
 *
 * Each entry below is { match, limit, windowMs }:
 *   - match    a path prefix or regex tested against request.nextUrl.pathname
 *   - limit    max requests allowed from a single IP in the window
 *   - windowMs sliding-window length in ms
 *
 * Keep limits tight for abuse-prone endpoints (auth/OTP, anything that
 * sends email or hits a paid API) and loose elsewhere so normal browsing
 * isn't blocked. This isn't a substitute for edge-level (Cloudflare)
 * rate limiting -- it's defense in depth and catches business-logic
 * cases the edge can't see.
 */
const RULES = [
  // Auth + OTP — most abuse-prone surface
  { match: /^\/api\/auth\/otp\/request/,  limit: 5,   windowMs: 60_000 },     // 5 per minute
  { match: /^\/api\/auth\/verify/,        limit: 10,  windowMs: 60_000 },     // 10 per minute
  { match: /^\/api\/auth\/register/,      limit: 3,   windowMs: 60_000 },     // 3 per minute
  { match: /^\/api\/auth\/resend-/,       limit: 3,   windowMs: 5 * 60_000 }, // 3 per 5 min

  // Preview endpoint — pre-auth probing surface
  { match: /^\/api\/preview/,             limit: 20,  windowMs: 60_000 },

  // Generic API ceiling so a buggy/malicious client can't hammer everything
  { match: /^\/api\//,                    limit: 60,  windowMs: 60_000 },
];

/**
 * In-process Map-based store. Lives in the Next.js server's memory:
 *  - Resets on every deploy (acceptable for our scale)
 *  - Per-instance (so an HA scaleout would let an attacker round-robin
 *    past it -- Cloudflare or Redis are the answer when that happens)
 *
 * Each entry is { count, resetAt } where resetAt is the unix-ms timestamp
 * when the window expires and count is the number of hits so far in it.
 */
type Bucket = { count: number; resetAt: number };
const STORE = new Map<string, Bucket>();

// Periodically prune expired entries so the Map doesn't grow forever.
// Runs only in the long-lived server context, not in edge runtime.
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [k, v] of STORE) if (v.resetAt < now) STORE.delete(k);
  }, 60_000).unref?.();
}

function clientIp(req: NextRequest): string {
  // Reverse proxies (Coolify -> Caddy/Traefik, or Cloudflare) put the real
  // IP in x-forwarded-for. If absent, fall back to the connection ip.
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || req.headers.get("cf-connecting-ip") || "unknown";
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Find the first matching rule, if any. Most specific rules are first.
  const rule = RULES.find((r) => r.match.test(path));
  if (!rule) return NextResponse.next();

  const ip = clientIp(req);
  const key = `${ip}|${rule.match.source}`;
  const now = Date.now();
  const entry = STORE.get(key);

  if (!entry || entry.resetAt < now) {
    STORE.set(key, { count: 1, resetAt: now + rule.windowMs });
    return NextResponse.next();
  }

  if (entry.count >= rule.limit) {
    const retryAfter = Math.max(1, Math.ceil((entry.resetAt - now) / 1000));
    return new NextResponse(
      JSON.stringify({
        error: "Rate limit exceeded",
        retryAfterSeconds: retryAfter,
      }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(retryAfter),
          "X-RateLimit-Limit": String(rule.limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
        },
      }
    );
  }

  entry.count += 1;
  STORE.set(key, entry);
  return NextResponse.next();
}

// Only run middleware for /api/* paths. Page navigations and static assets
// are excluded so we never accidentally throttle a browse session.
export const config = {
  matcher: ["/api/:path*"],
};
