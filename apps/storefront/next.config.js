/** @type {import('next').NextConfig} */
// Build marker: 2026-07-18 -- bumped to force the CI workflow's
// paths filter to actually trigger a fresh no-cache build after the
// GHA layer cache pinned every subsequent build to the July 10 output.
const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
const { hostname: cmsHostname, protocol: cmsProtocol, port: cmsPort } = new URL(cmsUrl);

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Canonicalize URLs — no trailing slash. /foo/ → /foo (308).
  // Required so Google doesn't treat /products/canva/ and /products/canva
  // as two separate URLs after the Shopify migration.
  trailingSlash: false,

  // Enable Next.js's built-in gzip/brotli on the standalone server.
  // Coolify's Traefik proxy passes Accept-Encoding through, so Next
  // compresses the response instead of shipping raw HTML. Measured:
  // the /  homepage drops from 1.5 MB raw → 67 KB brotli (95% smaller),
  // 4-second first load → ~500 ms.
  compress: true,

  // Strip the "X-Powered-By: Next.js" header — pointless bytes on
  // every response.
  poweredByHeader: false,

  // Per-route response headers. Cache-Control on HTML lets Cloudflare
  // (once proxied) hold pages at the edge for s-maxage seconds while
  // the browser refetches every request (max-age=0). Combined with
  // ISR on the page itself: the edge sees a fast 200, the origin
  // sees one revalidation request per window per POP.
  //
  // Static assets (_next/static/*) are already fingerprinted by
  // Next.js, so they can safely be cached forever.
  async headers() {
    return [
      {
        // Content-hashed JS/CSS/font/image bundles.
        source: "/_next/static/:path*",
        headers: [
          { key: "Cache-Control", value: "public, max-age=31536000, immutable" },
        ],
      },
      {
        // ISR-eligible HTML pages. Route matcher covers everything
        // except /api, /_next, /admin — those get their own no-cache
        // headers from the handler.
        source: "/((?!api|_next|admin).*)",
        headers: [
          {
            key: "Cache-Control",
            value: "public, max-age=0, s-maxage=60, stale-while-revalidate=300",
          },
        ],
      },
    ];
  },

  // ────────────────────────────────────────────────────────────
  // Shopify → Payload URL migration (301/308 permanent redirects)
  //
  // Shopify and Payload happen to share the /products/<slug> and
  // /collections/<slug> patterns, so most product and category URLs
  // need no redirect. What we redirect:
  //
  //   1. /collections/<cat>/products/<slug>  →  /products/<slug>
  //      Shopify nests products under a collection in the URL;
  //      our flat structure dropped the nesting.
  //
  //   2. /pages/<slug>  →  /policies/<...> or /about
  //      Shopify static pages map to specific new pages.
  //
  //   3. /collections/all, /collections/all-products, /collections
  //      All redirect to /products (canonical "browse all" URL).
  //
  //   4. Shopify-specific endpoints (/password, /checkouts/*, /cart/)
  //      Normalize or redirect to functional new pages.
  //
  //   5. Transliterated duplicate slugs (shtrkt-* ↔ Arabic)
  //      Choose the Arabic version as canonical (matches new catalog).
  //
  // NOTE: Slugs that exist on Shopify but NOT in your new Payload
  // catalog will 404. That's intentional — better than redirecting
  // to an unrelated page (Google treats those as "soft 404" and
  // demotes them anyway).
  // ────────────────────────────────────────────────────────────
  async redirects() {
    return [
      // ── 1. Shopify nested /collections/<cat>/products/<slug> ──
      // catches /collections/cap-cut-pro/products/capcut-pro-12,
      // /collections/linkedin-premium/products/..., etc.
      {
        source: "/collections/:cat/products/:slug",
        destination: "/products/:slug",
        permanent: true,
      },

      // ── 2. Shopify static pages → new equivalents ──
      { source: "/pages/privacy-policy",            destination: "/policies/privacy", permanent: true },
      { source: "/pages/refund-policy",             destination: "/policies/refund",  permanent: true },
      { source: "/pages/return-and-exchange-policy", destination: "/policies/refund", permanent: true },
      { source: "/pages/purchase-policy",           destination: "/policies/terms",   permanent: true },
      { source: "/pages/usage-policy",              destination: "/policies/terms",   permanent: true },
      { source: "/pages/who-are-we",                destination: "/about",            permanent: true },
      { source: "/pages/contact",                   destination: "/about",            permanent: true },
      { source: "/pages/b2b",                       destination: "/about",            permanent: true },
      { source: "/pages/reviews",                   destination: "/",                 permanent: true },
      { source: "/pages/thank-you",                 destination: "/",                 permanent: true },
      // Help/troubleshooting pages — no new equivalent yet, route to /about
      { source: "/pages/activate-youtube",          destination: "/about", permanent: true },
      { source: "/pages/payments-google",           destination: "/about", permanent: true },
      { source: "/pages/payments-google-2",         destination: "/about", permanent: true },
      { source: "/pages/payment-methods",           destination: "/about", permanent: true },
      { source: "/pages/youtube-problems",          destination: "/about", permanent: true },
      { source: "/pages/youtube-problems-3",        destination: "/about", permanent: true },
      { source: "/pages/youtube-problems-4",        destination: "/about", permanent: true },
      { source: "/pages/youtube-problems-5",        destination: "/about", permanent: true },
      { source: "/pages/youtube-50",                destination: "/about", permanent: true },
      { source: "/pages/pushdaddy-faq-1",           destination: "/about", permanent: true },
      // Anything else under /pages/* falls through to a 404 (Next.js default).

      // ── 3. "All products" Shopify collections → flat /products ──
      { source: "/collections",              destination: "/products", permanent: true },
      { source: "/collections/all",          destination: "/products", permanent: true },
      { source: "/collections/all-products", destination: "/products", permanent: true },

      // ── 4. Transliterated duplicate collection slugs ──
      // Old transliterated slugs that mean the same as the new Arabic slugs.
      {
        source: "/collections/shtrkt-jwjl-jymyny-gemini-ai-pro",
        destination: "/collections/اشتراكات-جوجل-جيميناي-gemini-ai-pro",
        permanent: true,
      },
      {
        source: "/collections/shtrkt-byrblksty-perplexity",
        destination: "/collections/اشتراكات-بيربلكستي-perplexity",
        permanent: true,
      },
      {
        source: "/collections/shtrkt-autodesk",
        destination: "/collections/اشتراكات-autodesk",
        permanent: true,
      },

      // ── 5. Shopify-specific endpoints ──
      { source: "/password",          destination: "/",          permanent: true },
      { source: "/checkouts/:path*",  destination: "/checkout",  permanent: false },
      // Shopify's storefront-locale prefix (e.g. /ar/<slug>) — our site is
      // single-locale Arabic-first, no /ar/ prefix.
      { source: "/ar/:path*",         destination: "/:path*",    permanent: true },

      // ── 6. Shopify blog/news content (not migrated) ──
      // /news/video-downloader and similar → /about as a last-resort
      // landing for any inbound link traffic.
      { source: "/news/:path*",       destination: "/about",     permanent: true },
    ];
  },

  images: {
    unoptimized: true,
    remotePatterns: [
      { protocol: "http",  hostname: "localhost", port: "3001" },
      {
        protocol: cmsProtocol.replace(":", ""),
        hostname: cmsHostname,
        ...(cmsPort ? { port: cmsPort } : {}),
      },
      { protocol: "https", hostname: "*.r2.cloudflarestorage.com" },
      { protocol: "https", hostname: "*.r2.dev" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
};

module.exports = nextConfig;
