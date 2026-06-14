/**
 * Export every blog post from the live Shopify site into JSON.
 *
 * Phase 1 of the blog migration:
 *   1. Read the Shopify blog sitemap to enumerate post URLs.
 *   2. Fetch each post's HTML.
 *   3. Extract title, slug, body HTML, featured image, author, date, tags.
 *   4. Write one JSON file per post to `blogs_export/posts/<slug>.json`.
 *   5. Write a summary `blogs_export/index.json` listing every post.
 *   6. Collect every Shopify CDN image URL referenced (featured + inline)
 *      into `blogs_export/images.json` — consumed by phase 2 (R2 migration).
 *
 * Image URLs in the saved JSON stay as the original cdn.shopify.com URLs.
 * Phase 2 (migrate-blog-images.js) rewrites them to R2 once the upload finishes.
 *
 * Idempotent: re-running skips posts already exported unless --overwrite is set.
 *
 * Usage:
 *   node scripts/export-shopify-blogs.js                       # full export
 *   node scripts/export-shopify-blogs.js --limit 5             # smoke test
 *   node scripts/export-shopify-blogs.js --overwrite           # force re-fetch
 *   node scripts/export-shopify-blogs.js --site https://digital-plus3.com
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");

const args = require("node:util").parseArgs({
  options: {
    site:       { type: "string", default: "https://digital-plus3.com" },
    out:        { type: "string", default: path.resolve(__dirname, "blogs_export") },
    limit:      { type: "string" },
    overwrite:  { type: "boolean", default: false },
    concurrency:{ type: "string", default: "1" },
    delay:      { type: "string", default: "800" },
  },
  strict: false,
}).values;

const SITE = String(args.site).replace(/\/$/, "");
const OUT_DIR = String(args.out);
const POSTS_DIR = path.join(OUT_DIR, "posts");
const LIMIT = args.limit ? parseInt(String(args.limit), 10) : null;
const CONCURRENCY = parseInt(String(args.concurrency), 10) || 2;
const DELAY_MS = parseInt(String(args.delay), 10) || 0;
const OVERWRITE = Boolean(args.overwrite);

// ── HTML extraction helpers ──────────────────────────────────────────

function meta(html, prop) {
  const re = new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]+)"`, "i");
  return html.match(re)?.[1] ?? null;
}
function metaName(html, name) {
  const re = new RegExp(`<meta[^>]+name="${name}"[^>]+content="([^"]+)"`, "i");
  return html.match(re)?.[1] ?? null;
}
function metaAll(html, prop) {
  const re = new RegExp(`<meta[^>]+property="${prop}"[^>]+content="([^"]+)"`, "gi");
  return [...html.matchAll(re)].map((m) => m[1]);
}
function decodeEntities(s) {
  if (!s) return s;
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ");
}

/**
 * The body lives in <div class="text">...</div>, sandwiched between the
 * featured image and the social share buttons. We use the closing
 * <div class="socials"> as the end anchor because Shopify's article
 * template is generated and that boundary is stable.
 */
function extractBody(html) {
  const start = html.search(/<div\s+class="text">/);
  if (start < 0) return null;
  const tail = html.slice(start);
  const endMarker = tail.search(/<div\s+class="socials">/);
  if (endMarker < 0) return null;
  let chunk = tail.slice(0, endMarker);
  // Strip the wrapping <div class="text"> open tag and an empty title placeholder
  chunk = chunk.replace(/^<div\s+class="text">\s*/, "");
  chunk = chunk.replace(/<h6\s+class="title">\s*<\/h6>\s*/, "");
  // Trim trailing whitespace + un-closed wrapping div
  return chunk.replace(/\s*<\/div>\s*$/, "").trim();
}

/**
 * <li>كتب بواسطة: NAME</li>  →  "NAME"
 * Falls back to <meta property="article:author">.
 */
function extractAuthor(html) {
  const m = html.match(/<li>كتب بواسطة:\s*([^<]+)<\/li>/);
  if (m) return m[1].trim();
  return meta(html, "article:author");
}

function extractPublishedDate(html) {
  const fromMeta = meta(html, "article:published_time");
  if (fromMeta) return fromMeta;
  const m = html.match(/<li[^>]*itemprop="datePublished[^"]*"[^>]*datetime="([^"]+)"/);
  return m?.[1] ?? null;
}

/** Pull every <img src> URL in the body so phase 2 knows what to migrate. */
function collectImageUrls(bodyHtml) {
  if (!bodyHtml) return [];
  const urls = new Set();
  for (const m of bodyHtml.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    urls.add(normalizeImageUrl(m[1]));
  }
  return [...urls];
}
function normalizeImageUrl(u) {
  if (!u) return u;
  // Shopify often emits protocol-relative URLs: //cdn.shopify.com/...
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http://")) return `https://${u.slice(7)}`;
  return u;
}

// ── Per-post pipeline ────────────────────────────────────────────────

const BROWSER_HEADERS = {
  "user-agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "accept-language": "ar,en-US;q=0.7,en;q=0.3",
  "accept-encoding": "gzip, deflate, br",
  "upgrade-insecure-requests": "1",
};

async function fetchWithRetry(url, maxAttempts = 6) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(url, { headers: BROWSER_HEADERS });
    if (res.ok) return res;
    if (![429, 503, 504].includes(res.status) || attempt === maxAttempts) return res;
    // Honor Retry-After if Cloudflare sends one; else exponential backoff up to 2 min.
    const retryAfter = parseInt(res.headers.get("retry-after") || "", 10);
    const backoffMs = Number.isFinite(retryAfter) && retryAfter > 0
      ? retryAfter * 1000
      : Math.min(120_000, 2000 * 2 ** (attempt - 1));
    await new Promise((r) => setTimeout(r, backoffMs));
  }
}

async function scrapePost(url) {
  const slug = decodeURIComponent(url.split("/").pop());
  const filePath = path.join(POSTS_DIR, `${slug}.json`);

  if (!OVERWRITE && fs.existsSync(filePath)) {
    return { slug, status: "skipped", filePath };
  }

  const res = await fetchWithRetry(url);
  if (!res.ok) return { slug, status: "fetch-failed", code: res.status };
  const html = await res.text();

  const title = decodeEntities(meta(html, "og:title"));
  const excerpt = decodeEntities(meta(html, "og:description") || metaName(html, "description"));
  const featuredImage = normalizeImageUrl(meta(html, "og:image"));
  const publishedAt = extractPublishedDate(html);
  const modifiedAt = meta(html, "article:modified_time");
  const author = extractAuthor(html);
  const tags = metaAll(html, "article:tag");
  const bodyHtml = extractBody(html);
  const inlineImages = collectImageUrls(bodyHtml);

  if (!title || !bodyHtml) {
    return { slug, status: "parse-failed", title: !!title, body: !!bodyHtml };
  }

  const post = {
    slug,
    url,
    title,
    excerpt,
    featuredImage,
    publishedAt,
    modifiedAt,
    author,
    tags,
    bodyHtml,
    inlineImages,
    scrapedAt: new Date().toISOString(),
  };

  await fsp.writeFile(filePath, JSON.stringify(post, null, 2), "utf8");
  return { slug, status: "ok", filePath, imageCount: 1 + inlineImages.length };
}

async function runWithConcurrency(items, fn, limit) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); }
      catch (e) { out[idx] = { error: e.message }; }
      if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  await fsp.mkdir(POSTS_DIR, { recursive: true });

  console.log(`📥 Fetching blog sitemap…`);
  const idxXml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
  const blogSitemap = idxXml.match(/<loc>(https:\/\/[^<]*sitemap_blogs[^<]*)<\/loc>/)?.[1]?.replace(/&amp;/g, "&");
  if (!blogSitemap) throw new Error("No blog sitemap found in sitemapindex");

  const blogXml = await fetch(blogSitemap).then((r) => r.text());
  const allUrls = [...blogXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    // Keep only post URLs — drop the /blogs/<channel> index page.
    .filter((u) => new URL(u).pathname.split("/").filter(Boolean).length >= 3);

  const urls = LIMIT ? allUrls.slice(0, LIMIT) : allUrls;
  console.log(`✅ Found ${allUrls.length} posts, processing ${urls.length}${OVERWRITE ? " (overwrite mode)" : ""}\n`);

  let done = 0;
  const results = await runWithConcurrency(urls, async (url) => {
    const r = await scrapePost(url);
    done++;
    const tag = r.status === "ok" ? "✓" : r.status === "skipped" ? "↩" : "✗";
    console.log(`  ${tag} [${done}/${urls.length}] ${r.slug} (${r.status})`);
    return r;
  }, CONCURRENCY);

  // ── Summary ──
  const ok = results.filter((r) => r?.status === "ok");
  const skipped = results.filter((r) => r?.status === "skipped");
  const failed = results.filter((r) => r && r.status !== "ok" && r.status !== "skipped");

  // ── Index of every post (refreshed each run) ──
  // Re-read every JSON file to get the canonical state, since a partial
  // run could leave stale entries if we only used `ok` from this batch.
  const indexEntries = [];
  for (const file of await fsp.readdir(POSTS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(await fsp.readFile(path.join(POSTS_DIR, file), "utf8"));
    indexEntries.push({
      slug: data.slug,
      title: data.title,
      publishedAt: data.publishedAt,
      tags: data.tags,
      featuredImage: data.featuredImage,
    });
  }
  // Newest first.
  indexEntries.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  await fsp.writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify({ exportedAt: new Date().toISOString(), count: indexEntries.length, posts: indexEntries }, null, 2),
    "utf8"
  );

  // ── Unique image URL list for phase 2 (R2 migration) ──
  const allImages = new Set();
  for (const file of await fsp.readdir(POSTS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(await fsp.readFile(path.join(POSTS_DIR, file), "utf8"));
    if (data.featuredImage) allImages.add(data.featuredImage);
    for (const img of data.inlineImages || []) allImages.add(img);
  }
  await fsp.writeFile(
    path.join(OUT_DIR, "images.json"),
    JSON.stringify({ count: allImages.size, images: [...allImages] }, null, 2),
    "utf8"
  );

  console.log(`\n── Summary ──`);
  console.log(`   Exported:    ${ok.length}`);
  console.log(`   Skipped:     ${skipped.length}`);
  console.log(`   Failed:      ${failed.length}`);
  console.log(`   Total posts: ${indexEntries.length}`);
  console.log(`   Unique imgs: ${allImages.size}`);
  console.log(`   Out dir:     ${OUT_DIR}`);
  if (failed.length) {
    console.log(`\n❌ Failures:`);
    for (const f of failed) console.log(`   - ${f.slug}: ${f.status} ${f.code || ""}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
