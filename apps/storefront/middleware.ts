import { NextRequest, NextResponse } from "next/server";

/**
 * Page routes whose response body is scoped to the signed-in user.
 *
 * These MUST never be served from any cache layer -- browser disk
 * cache, Cloudflare edge, or a shared proxy -- because the same URL
 * returns different content depending on the session cookie. The
 * symptom when this leaks is exactly the one we hit: user A visits
 * /orders, signs out, user B signs in on the same browser, navigates
 * to /orders via a client-side <Link>, and sees A's data until they
 * hit F5. `dynamic = "force-dynamic"` on the page keeps the ORIGIN
 * from caching, but Next 14 doesn't always emit the response headers
 * a CDN needs to keep its own cache out of the loop. Stamping the
 * headers explicitly here makes it unambiguous:
 *
 *   Cache-Control: private, no-store, must-revalidate  -> no cache
 *                                                          layer may
 *                                                          retain
 *                                                          this body
 *   Vary: Cookie                                       -> if any
 *                                                          cache
 *                                                          ignores the
 *                                                          above, at
 *                                                          least key
 *                                                          on cookies
 *
 * Both the HTML document AND the RSC prefetch responses go through
 * middleware, so a hovered <Link href="/orders"> that Next prefetches
 * silently in the background can't poison the browser HTTP cache with
 * a previous user's payload either.
 */
const AUTH_SCOPED_PAGES = [
  /^\/orders(\/|$|\?)/,
  /^\/account(\/|$|\?)/,
  /^\/wishlist(\/|$|\?)/,
  /^\/checkout(\/|$|\?)/,
  /^\/cart(\/|$|\?)/,
];

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

/** Apply `Cache-Control: no-store` to a NextResponse and return it. */
function stampNoStore(res: NextResponse): NextResponse {
  res.headers.set("Cache-Control", "private, no-store, must-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Vary", "Cookie");
  return res;
}

export function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;

  // Auth-scoped page routes: force revalidation at every cache layer
  // so signing out and back in as a different account can never
  // surface the previous user's data. Runs BEFORE the rate-limit
  // check because these paths aren't under /api/*, so we short-
  // circuit early.
  if (AUTH_SCOPED_PAGES.some((r) => r.test(path))) {
    return stampNoStore(NextResponse.next());
  }

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

// Run middleware for /api/* (rate limiting) AND the auth-scoped page
// routes listed above (no-store headers). Static assets and the
// public storefront pages skip middleware entirely so browsing stays
// throttle-free and CDN-friendly.
export const config = {
  matcher: [
    "/api/:path*",
    "/orders/:path*",
    "/account/:path*",
    "/wishlist/:path*",
    "/checkout/:path*",
    "/cart/:path*",
  ],
};
