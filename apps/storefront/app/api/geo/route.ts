import { NextResponse } from "next/server";
import { headers } from "next/headers";

/**
 * /api/geo — detect the visitor's country via CDN/proxy headers and
 * return the most appropriate display currency.
 *
 * Reads (in order of preference):
 *   1. Vercel:     x-vercel-ip-country
 *   2. Cloudflare: cf-ipcountry
 *   3. Coolify/Traefik with geo plugin: x-country / x-geo-country
 *   4. Fly.io:     fly-client-ip + region (skipped — we'd need a lookup)
 *
 * If no header is present (local dev / bare reverse proxy with no geo
 * plugin), returns the default currency. The client treats this as
 * "couldn't detect" and just keeps whatever the user previously had.
 *
 * Per-user response — must NOT be cached.
 */

const COUNTRY_TO_CURRENCY: Record<string, "USD" | "SAR" | "AED" | "JOD"> = {
  // Saudi Arabia
  SA: "SAR",
  // UAE
  AE: "AED",
  // Jordan
  JO: "JOD",
  // GCC countries — show SAR as a familiar regional currency until you
  // add KWD / BHD / QAR / OMR to the Payload `currency` enum.
  KW: "SAR",
  BH: "SAR",
  QA: "SAR",
  OM: "SAR",
  // Egypt, Iraq, Yemen, Palestine, Lebanon, Syria — default to USD
  // until you stock products priced in EGP/IQD/etc.
  // (Falls through to default below.)
};

const DEFAULT_CURRENCY = "USD";

export const dynamic = "force-dynamic";

export async function GET() {
  const h = headers();

  const rawCountry =
    h.get("x-vercel-ip-country") ||
    h.get("cf-ipcountry") ||
    h.get("x-country") ||
    h.get("x-geo-country") ||
    "";

  const country = rawCountry.toUpperCase().slice(0, 2);
  const detected = COUNTRY_TO_CURRENCY[country];
  const currency = detected || DEFAULT_CURRENCY;

  return NextResponse.json(
    {
      country: country || null,
      currency,
      // Tells the client whether this was a real detection or just the
      // fallback. The client only auto-applies currency on first visit
      // when `detected === true`.
      detected: Boolean(detected),
    },
    {
      headers: { "Cache-Control": "no-store, max-age=0" },
    }
  );
}
