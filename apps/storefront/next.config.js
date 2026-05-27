/** @type {import('next').NextConfig} */
const cmsUrl = process.env.PAYLOAD_PUBLIC_SERVER_URL || "http://localhost:3001";
const { hostname: cmsHostname, protocol: cmsProtocol, port: cmsPort } = new URL(cmsUrl);

const nextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  // Canonicalize URLs — no trailing slash. /foo/ → /foo (308).
  // Required so Google doesn't treat /products/canva/ and /products/canva
  // as two separate URLs after the Shopify migration.
  trailingSlash: false,

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
