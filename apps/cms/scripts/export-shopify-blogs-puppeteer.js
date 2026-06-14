/**
 * Same export as export-shopify-blogs.js, but uses a real Chrome instance via
 * Puppeteer so Cloudflare can't fingerprint us as a bot.
 *
 * Use when the plain-fetch scraper hits Cloudflare's 429 cool-down (which
 * persists on your IP for ~30-60 min after a burst). Real-browser TLS
 * fingerprint + JS execution sails through.
 *
 * Reuses the same blogs_export/posts/<slug>.json layout — idempotent with
 * the fetch scraper, so already-exported posts are skipped.
 *
 * Usage:
 *   node scripts/export-shopify-blogs-puppeteer.js
 *   node scripts/export-shopify-blogs-puppeteer.js --limit 5
 *   node scripts/export-shopify-blogs-puppeteer.js --headless
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const puppeteer = require("puppeteer-core");

const args = require("node:util").parseArgs({
  options: {
    site:       { type: "string",  default: "https://digital-plus3.com" },
    out:        { type: "string",  default: path.resolve(__dirname, "blogs_export") },
    limit:      { type: "string" },
    overwrite:  { type: "boolean", default: false },
    headless:   { type: "boolean", default: false },
    chrome:     { type: "string",  default: "C:/Program Files/Google/Chrome/Application/chrome.exe" },
    delay:      { type: "string",  default: "400" },
  },
  strict: false,
}).values;

const SITE = String(args.site).replace(/\/$/, "");
const OUT_DIR = String(args.out);
const POSTS_DIR = path.join(OUT_DIR, "posts");
const LIMIT = args.limit ? parseInt(String(args.limit), 10) : null;
const OVERWRITE = Boolean(args.overwrite);
const HEADLESS = Boolean(args.headless);
const CHROME = String(args.chrome);
const DELAY_MS = parseInt(String(args.delay), 10) || 0;

// ── HTML extraction helpers (identical to the fetch scraper) ──

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
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ");
}
function extractBody(html) {
  const start = html.search(/<div\s+class="text">/);
  if (start < 0) return null;
  const tail = html.slice(start);
  const end = tail.search(/<div\s+class="socials">/);
  if (end < 0) return null;
  let chunk = tail.slice(0, end);
  chunk = chunk.replace(/^<div\s+class="text">\s*/, "");
  chunk = chunk.replace(/<h6\s+class="title">\s*<\/h6>\s*/, "");
  return chunk.replace(/\s*<\/div>\s*$/, "").trim();
}
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
function normalizeImageUrl(u) {
  if (!u) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http://")) return `https://${u.slice(7)}`;
  return u;
}
function collectImageUrls(bodyHtml) {
  if (!bodyHtml) return [];
  const urls = new Set();
  for (const m of bodyHtml.matchAll(/<img[^>]+src="([^"]+)"/gi)) {
    urls.add(normalizeImageUrl(m[1]));
  }
  return [...urls];
}

// ── Main ────────────────────────────────────────────────────────────

async function main() {
  await fsp.mkdir(POSTS_DIR, { recursive: true });

  console.log(`📥 Fetching blog sitemap (plain fetch — sitemap requests don't get blocked)…`);
  const idxXml = await fetch(`${SITE}/sitemap.xml`).then((r) => r.text());
  const blogSitemap = idxXml.match(/<loc>(https:\/\/[^<]*sitemap_blogs[^<]*)<\/loc>/)?.[1]?.replace(/&amp;/g, "&");
  if (!blogSitemap) throw new Error("No blog sitemap found");
  const blogXml = await fetch(blogSitemap).then((r) => r.text());
  const allUrls = [...blogXml.matchAll(/<loc>([^<]+)<\/loc>/g)]
    .map((m) => m[1])
    .filter((u) => new URL(u).pathname.split("/").filter(Boolean).length >= 3);

  // Pre-filter: skip already-exported in OVERWRITE=false mode so we don't even spin up the browser for them.
  const todo = allUrls.filter((u) => {
    const slug = decodeURIComponent(u.split("/").pop());
    return OVERWRITE || !fs.existsSync(path.join(POSTS_DIR, `${slug}.json`));
  });
  const urls = LIMIT ? todo.slice(0, LIMIT) : todo;

  console.log(`✅ Sitemap has ${allUrls.length} URLs.  Already done: ${allUrls.length - todo.length}.  Will fetch: ${urls.length}.`);

  if (urls.length === 0) {
    console.log("Nothing to do.");
    return;
  }

  console.log(`🚀 Launching ${HEADLESS ? "headless " : ""}Chrome at ${CHROME}…`);
  const browser = await puppeteer.launch({
    executablePath: CHROME,
    headless: HEADLESS,
    args: ["--lang=ar,en-US"],
    defaultViewport: { width: 1280, height: 800 },
  });

  // One tab, navigate sequentially. Faster than multi-tab and friendlier
  // to Cloudflare's per-session connection limits.
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({ "accept-language": "ar,en-US;q=0.7,en;q=0.3" });

  let done = 0, ok = 0, failed = 0;

  for (const url of urls) {
    const slug = decodeURIComponent(url.split("/").pop());
    const filePath = path.join(POSTS_DIR, `${slug}.json`);
    done++;

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30_000 });
      const html = await page.content();

      const title = decodeEntities(meta(html, "og:title"));
      const excerpt = decodeEntities(meta(html, "og:description") || metaName(html, "description"));
      const featuredImage = normalizeImageUrl(meta(html, "og:image"));
      const bodyHtml = extractBody(html);

      if (!title || !bodyHtml) {
        failed++;
        console.log(`  ✗ [${done}/${urls.length}] ${slug} (parse-failed)`);
        continue;
      }

      const post = {
        slug,
        url,
        title,
        excerpt,
        featuredImage,
        publishedAt: extractPublishedDate(html),
        modifiedAt: meta(html, "article:modified_time"),
        author: extractAuthor(html),
        tags: metaAll(html, "article:tag"),
        bodyHtml,
        inlineImages: collectImageUrls(bodyHtml),
        scrapedAt: new Date().toISOString(),
      };
      await fsp.writeFile(filePath, JSON.stringify(post, null, 2), "utf8");
      ok++;
      console.log(`  ✓ [${done}/${urls.length}] ${slug}`);
    } catch (err) {
      failed++;
      console.log(`  ✗ [${done}/${urls.length}] ${slug} (${err.message})`);
    }

    if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
  }

  await browser.close();

  // Refresh the export index + image list (same as fetch scraper does).
  const indexEntries = [];
  for (const file of await fsp.readdir(POSTS_DIR)) {
    if (!file.endsWith(".json")) continue;
    const data = JSON.parse(await fsp.readFile(path.join(POSTS_DIR, file), "utf8"));
    indexEntries.push({
      slug: data.slug, title: data.title, publishedAt: data.publishedAt,
      tags: data.tags, featuredImage: data.featuredImage,
    });
  }
  indexEntries.sort((a, b) => (b.publishedAt || "").localeCompare(a.publishedAt || ""));
  await fsp.writeFile(
    path.join(OUT_DIR, "index.json"),
    JSON.stringify({ exportedAt: new Date().toISOString(), count: indexEntries.length, posts: indexEntries }, null, 2),
    "utf8"
  );
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
  console.log(`   Exported this run: ${ok}`);
  console.log(`   Failed this run:   ${failed}`);
  console.log(`   Total posts:       ${indexEntries.length}`);
  console.log(`   Unique images:     ${allImages.size}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
