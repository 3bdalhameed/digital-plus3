/**
 * Resolve a Payload media URL to something the visitor's browser
 * can actually fetch.
 *
 * Payload returns media URLs as either absolute (when
 * PAYLOAD_PUBLIC_SERVER_URL is set on the CMS side) or as a bare
 * "/media/xxx.png" path. The storefront runs on a different origin
 * from the CMS, so a bare path 404s from the browser. Prefix with
 * the PUBLIC CMS origin whenever we get back a relative URL.
 *
 * PAYLOAD_API_URL is the internal Docker hostname
 * (http://cms:3001/api) that server-side fetches use; the browser
 * can't reach that. PAYLOAD_PUBLIC_SERVER_URL is the URL an end
 * user's browser CAN reach (https://cms.digital-plus3.com) -- try
 * that first, fall back to PAYLOAD_API_URL for local dev where
 * they're often the same host.
 *
 * Server-only helper -- reads process.env, so keep it out of
 * client component bundles.
 */
export function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  const publicOrigin =
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    process.env.PAYLOAD_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3001";
  return `${publicOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}
