/**
 * Audit the live sitemap against the CMS + the live storefront.
 *
 * What it checks:
 *   1. Fetches the live sitemap.xml from the storefront.
 *   2. Extracts every <loc> URL.
 *   3. For each, sends a HEAD request and records the status code.
 *   4. Cross-references product URLs against the Payload CMS catalog and
 *      reports any /products/<slug> URLs whose slug does NOT exist in CMS
 *      (the sitemap shouldn't contain these but bugs happen).
 *   5. Reports any *published* CMS products whose slug is NOT in the sitemap
 *      (so you find products that should be discoverable but aren't).
 *
 * Usage:
 *   node scripts/audit-sitemap.js                        # uses defaults (prod)
 *   node scripts/audit-sitemap.js --site https://stg.digital-plus3.com
 *   node scripts/audit-sitemap.js --site https://digital-plus3.com --cms https://cms.digital-plus3.com
 *
 * Defaults:
 *   --site  https://digital-plus3.com
 *   --cms   https://cms.digital-plus3.com
 */

const args = require("node:util").parseArgs({
  options: {
    site: { type: "string", default: "https://digital-plus3.com" },
    cms:  { type: "string", default: "https://cms.digital-plus3.com" },
    concurrency: { type: "string", default: "10" },
  },
  strict: false,
}).values;

const SITE = String(args.site).replace(/\/$/, "");
const CMS  = String(args.cms).replace(/\/$/, "");
const CONCURRENCY = parseInt(String(args.concurrency), 10) || 10;

async function fetchSitemap() {
  const url = `${SITE}/sitemap.xml`;
  console.log(`📥 Fetching sitemap: ${url}`);
  const res = await fetch(url, { headers: { "user-agent": "audit-sitemap/1.0" } });
  if (!res.ok) throw new Error(`Sitemap fetch failed: ${res.status}`);
  const xml = await res.text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1].trim());
  return locs;
}

async function fetchCmsProductSlugs() {
  const url = `${CMS}/api/products?limit=1000&depth=0&where[status][equals]=published`;
  console.log(`📥 Fetching CMS products: ${url}`);
  const res = await fetch(url);
  if (!res.ok) {
    console.warn(`  ⚠ CMS fetch failed (${res.status}). Skipping CMS cross-check.`);
    return null;
  }
  const json = await res.json();
  const docs = json.docs || [];
  if (json.totalPages > 1) {
    const more = await Promise.all(
      Array.from({ length: json.totalPages - 1 }, (_, i) =>
        fetch(`${url}&page=${i + 2}`).then((r) => r.json())
      )
    );
    for (const m of more) docs.push(...(m.docs || []));
  }
  return new Set(docs.map((d) => d.slug).filter(Boolean));
}

async function checkStatus(url) {
  try {
    const ctl = new AbortController();
    const t = setTimeout(() => ctl.abort(), 10_000);
    const res = await fetch(url, {
      method: "HEAD",
      redirect: "manual",
      signal: ctl.signal,
      headers: { "user-agent": "audit-sitemap/1.0" },
    });
    clearTimeout(t);
    return res.status;
  } catch (e) {
    return `ERR:${e.code || e.name || "unknown"}`;
  }
}

async function runWithConcurrency(items, fn, limit) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      out[idx] = await fn(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

function extractProductSlug(url) {
  const m = url.match(/\/products\/([^/?#]+)/);
  return m ? decodeURIComponent(m[1]) : null;
}

async function main() {
  console.log(`🔍 Auditing: ${SITE}`);
  console.log(`   CMS:      ${CMS}\n`);

  const [sitemapUrls, cmsSlugs] = await Promise.all([
    fetchSitemap(),
    fetchCmsProductSlugs(),
  ]);

  console.log(`✅ Sitemap has ${sitemapUrls.length} URLs`);
  if (cmsSlugs) console.log(`✅ CMS has ${cmsSlugs.size} published products\n`);

  // ── Check each sitemap URL ──
  console.log(`🌐 Checking status of ${sitemapUrls.length} URLs (concurrency=${CONCURRENCY})...`);
  let done = 0;
  const statuses = await runWithConcurrency(
    sitemapUrls,
    async (url) => {
      const status = await checkStatus(url);
      done++;
      if (done % 25 === 0) process.stdout.write(`   ${done}/${sitemapUrls.length}\n`);
      return { url, status };
    },
    CONCURRENCY
  );

  // ── Aggregate ──
  const bad = statuses.filter((s) => typeof s.status === "string" || (s.status >= 400));
  const redirects = statuses.filter((s) => typeof s.status === "number" && s.status >= 300 && s.status < 400);
  const ok = statuses.filter((s) => typeof s.status === "number" && s.status >= 200 && s.status < 300);

  console.log(`\n── Status summary ──`);
  console.log(`   OK (2xx):      ${ok.length}`);
  console.log(`   Redirect (3xx): ${redirects.length}`);
  console.log(`   Failed:        ${bad.length}`);

  if (bad.length) {
    console.log(`\n❌ Failing URLs:`);
    for (const b of bad) console.log(`   [${b.status}] ${b.url}`);
  }
  if (redirects.length) {
    console.log(`\n↪ Redirecting URLs (sitemap should point to final URL):`);
    for (const r of redirects) console.log(`   [${r.status}] ${r.url}`);
  }

  // ── Cross-check sitemap product URLs against CMS ──
  if (cmsSlugs) {
    const sitemapProductSlugs = new Set(
      sitemapUrls.map(extractProductSlug).filter(Boolean)
    );

    const inSitemapNotInCms = [...sitemapProductSlugs].filter((s) => !cmsSlugs.has(s));
    const inCmsNotInSitemap = [...cmsSlugs].filter((s) => !sitemapProductSlugs.has(s));

    console.log(`\n── CMS cross-check ──`);
    console.log(`   Sitemap product slugs:      ${sitemapProductSlugs.size}`);
    console.log(`   CMS published product slugs: ${cmsSlugs.size}`);
    console.log(`   In sitemap but NOT in CMS:   ${inSitemapNotInCms.length}`);
    console.log(`   In CMS but NOT in sitemap:   ${inCmsNotInSitemap.length}`);

    if (inSitemapNotInCms.length) {
      console.log(`\n⚠ Slugs in sitemap that don't exist in CMS (would 404):`);
      for (const s of inSitemapNotInCms) console.log(`   - ${s}`);
    }
    if (inCmsNotInSitemap.length) {
      console.log(`\n⚠ Published products missing from sitemap (SEO lost):`);
      for (const s of inCmsNotInSitemap) console.log(`   - ${s}`);
    }
  }

  console.log(`\n✓ Done.`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
