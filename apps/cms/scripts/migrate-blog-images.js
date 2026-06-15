/**
 * Migrate every image referenced by an exported blog post from Shopify CDN
 * to Cloudflare R2, then rewrite the post JSONs so they point at R2.
 *
 * Why: after the Shopify -> Payload cutover the storefront still loads images
 * from cdn.shopify.com / digital-plus3.com (Shopify-proxied). Migrating now
 * means we own the image hosting and can shut Shopify down without breaking
 * the blog.
 *
 * Strategy:
 *   1. Walk blogs_export/posts/*.json, collect every unique image URL
 *      (featuredImage + inlineImages).
 *   2. Try to download with a real browser User-Agent. If the storefront-
 *      proxied URL (digital-plus3.com/cdn/shop/articles/...) gets 429'd,
 *      transparently retry against cdn.shopify.com (same backing bucket).
 *   3. Hash content; upload to R2 at `New folder/blogs/<hash><ext>` — same
 *      prefix convention the Media collection's afterChange uses. Dedupe
 *      by hash so identical images shared across posts upload once.
 *   4. Persist url-map.json so re-runs skip already-uploaded files.
 *   5. After all uploads succeed, rewrite each post JSON in place:
 *      featuredImage and every <img src> in bodyHtml swap to R2 URLs.
 *
 * Reads R2 creds from scripts/.env (gitignored). Same env keys the CMS uses.
 *
 * Usage:
 *   node scripts/migrate-blog-images.js                  # full run
 *   node scripts/migrate-blog-images.js --limit 10       # smoke test
 *   node scripts/migrate-blog-images.js --concurrency 4  # default 3
 *   node scripts/migrate-blog-images.js --rewrite-only   # skip uploads,
 *                                                       # just patch JSONs
 */

const fs = require("node:fs");
const fsp = require("node:fs/promises");
const path = require("node:path");
const crypto = require("node:crypto");
const { S3Client, PutObjectCommand, HeadObjectCommand } = require("@aws-sdk/client-s3");

const args = require("node:util").parseArgs({
  options: {
    "in":             { type: "string",  default: path.resolve(__dirname, "blogs_export/posts") },
    map:              { type: "string",  default: path.resolve(__dirname, "blogs_export/url-map.json") },
    limit:            { type: "string" },
    concurrency:      { type: "string",  default: "3" },
    delay:            { type: "string",  default: "200" },
    "rewrite-only":   { type: "boolean", default: false },
    "force-rehash":   { type: "boolean", default: false },
  },
  strict: false,
}).values;

// ── Env ─────────────────────────────────────────────────────────────
const envPath = path.resolve(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split("\n")) {
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i < 0) continue;
    const k = line.slice(0, i).trim();
    const v = line.slice(i + 1).trim();
    if (!process.env[k]) process.env[k] = v;
  }
}

const IN_DIR = String(args.in);
const MAP_PATH = String(args.map);
const LIMIT = args.limit ? parseInt(String(args.limit), 10) : null;
const CONCURRENCY = parseInt(String(args.concurrency), 10) || 3;
const DELAY_MS = parseInt(String(args.delay), 10) || 0;
const REWRITE_ONLY = Boolean(args["rewrite-only"]);
const FORCE = Boolean(args["force-rehash"]);

const S3_BUCKET = process.env.S3_BUCKET;
const S3_ENDPOINT = process.env.S3_ENDPOINT;
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID;
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY;
const S3_PUBLIC_URL = (process.env.S3_PUBLIC_URL || "").replace(/\/$/, "");
const S3_REGION = process.env.S3_REGION || "auto";
const S3_PREFIX = "New folder/blogs"; // matches Media collection's "New folder/" convention

if (!REWRITE_ONLY && (!S3_BUCKET || !S3_ENDPOINT || !S3_ACCESS_KEY_ID || !S3_SECRET_ACCESS_KEY || !S3_PUBLIC_URL)) {
  console.error("Missing R2 env vars. Set S3_BUCKET, S3_ENDPOINT, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY, S3_PUBLIC_URL in scripts/.env");
  process.exit(1);
}

const s3 = REWRITE_ONLY ? null : new S3Client({
  region: S3_REGION,
  endpoint: S3_ENDPOINT,
  credentials: { accessKeyId: S3_ACCESS_KEY_ID, secretAccessKey: S3_SECRET_ACCESS_KEY },
  forcePathStyle: true,
});

// ── Helpers ─────────────────────────────────────────────────────────
const BROWSER_HEADERS = {
  "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "accept": "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
  "accept-language": "ar,en-US;q=0.7,en;q=0.3",
};

const SHOPIFY_CDN_PREFIX = "https://cdn.shopify.com/s/files/1/0816/2495/7209/";

/**
 * Rewrite the storefront-proxied image URL to the direct Shopify CDN URL.
 * Both serve the same backing file; the CDN one isn't behind Cloudflare so
 * it doesn't get rate-limited.
 */
function toCdnUrl(url) {
  if (!url.includes("digital-plus3.com/cdn/shop/")) return null;
  const m = url.match(/\/cdn\/shop\/(articles|files)\/(.+)$/);
  if (!m) return null;
  return `${SHOPIFY_CDN_PREFIX}${m[1]}/${m[2]}`;
}

function extOf(url) {
  try {
    const u = new URL(url);
    const m = u.pathname.match(/\.[a-zA-Z0-9]{2,5}$/);
    return m ? m[0].toLowerCase() : ".jpg";
  } catch { return ".jpg"; }
}

function r2UrlFor(key) {
  // Match the Media collection's URL encoding ("New folder" → "New%20folder")
  return `${S3_PUBLIC_URL}/${key.split("/").map(encodeURIComponent).join("/")}`;
}

async function downloadOnce(url) {
  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), 30_000);
  try {
    const res = await fetch(url, { headers: BROWSER_HEADERS, signal: ctl.signal });
    if (!res.ok) return { ok: false, status: res.status };
    const buf = Buffer.from(await res.arrayBuffer());
    return { ok: true, buf, contentType: res.headers.get("content-type") || "image/jpeg" };
  } finally { clearTimeout(t); }
}

async function downloadImage(url) {
  // Try the URL as-is first.
  let r = await downloadOnce(url);
  if (r.ok) return r;
  // If we got rate-limited from the storefront proxy, fall back to the CDN.
  const cdn = toCdnUrl(url);
  if (cdn && (r.status === 429 || r.status === 403)) {
    r = await downloadOnce(cdn);
    if (r.ok) return r;
  }
  return r; // bubble up the failure
}

async function r2HasKey(key) {
  try {
    await s3.send(new HeadObjectCommand({ Bucket: S3_BUCKET, Key: key }));
    return true;
  } catch (e) {
    if (e?.$metadata?.httpStatusCode === 404 || e?.name === "NotFound") return false;
    throw e;
  }
}

async function uploadToR2(key, buf, contentType) {
  await s3.send(new PutObjectCommand({
    Bucket: S3_BUCKET, Key: key, Body: buf, ContentType: contentType,
  }));
}

async function loadMap() {
  if (!fs.existsSync(MAP_PATH)) return {};
  return JSON.parse(await fsp.readFile(MAP_PATH, "utf8"));
}
async function saveMap(map) {
  await fsp.writeFile(MAP_PATH, JSON.stringify(map, null, 2), "utf8");
}

function normalizeImageUrl(u) {
  if (!u) return u;
  if (u.startsWith("//")) return `https:${u}`;
  if (u.startsWith("http://")) return `https://${u.slice(7)}`;
  return u;
}

// ── Main ────────────────────────────────────────────────────────────
async function main() {
  // Collect every unique image URL from every post.
  const postFiles = fs.readdirSync(IN_DIR).filter((f) => f.endsWith(".json"));
  const allUrls = new Set();
  for (const f of postFiles) {
    const data = JSON.parse(await fsp.readFile(path.join(IN_DIR, f), "utf8"));
    if (data.featuredImage) allUrls.add(normalizeImageUrl(data.featuredImage));
    for (const u of data.inlineImages || []) allUrls.add(normalizeImageUrl(u));
  }
  const urls = [...allUrls];
  console.log(`📊 ${postFiles.length} posts reference ${urls.length} unique images.`);

  const map = await loadMap();
  console.log(`💾 url-map.json already has ${Object.keys(map).length} entries.`);

  if (!REWRITE_ONLY) {
    const todo = urls.filter((u) => FORCE || !map[u]);
    const slice = LIMIT ? todo.slice(0, LIMIT) : todo;
    console.log(`📤 Will upload ${slice.length} new images (${todo.length} total pending, ${urls.length - todo.length} already done).\n`);

    let done = 0, ok = 0, failed = 0;
    let mapDirty = 0;

    const runWorker = async () => {
      while (true) {
        const url = slice[done++];
        if (!url) return;
        const idx = done;
        try {
          const dl = await downloadImage(url);
          if (!dl.ok) {
            failed++;
            console.log(`  ✗ [${idx}/${slice.length}] ${url.slice(-80)} (HTTP ${dl.status})`);
            continue;
          }
          const hash = crypto.createHash("sha256").update(dl.buf).digest("hex").slice(0, 16);
          const key = `${S3_PREFIX}/${hash}${extOf(url)}`;
          // If another URL already hashed to this key, no need to re-upload.
          let needsUpload = true;
          for (const v of Object.values(map)) { if (v === r2UrlFor(key)) { needsUpload = false; break; } }
          if (needsUpload && (await r2HasKey(key))) needsUpload = false;
          if (needsUpload) {
            await uploadToR2(key, dl.buf, dl.contentType);
          }
          map[url] = r2UrlFor(key);
          ok++;
          mapDirty++;
          if (mapDirty % 25 === 0) { await saveMap(map); mapDirty = 0; }
          console.log(`  ✓ [${idx}/${slice.length}] ${(dl.buf.length / 1024).toFixed(0)}KB → ${key}`);
          if (DELAY_MS) await new Promise((r) => setTimeout(r, DELAY_MS));
        } catch (err) {
          failed++;
          console.log(`  ✗ [${idx}/${slice.length}] ${url.slice(-80)} (${err.message})`);
        }
      }
    };

    await Promise.all(Array.from({ length: CONCURRENCY }, () => runWorker()));
    await saveMap(map);
    console.log(`\n── Upload summary ──`);
    console.log(`   Uploaded: ${ok}`);
    console.log(`   Failed:   ${failed}`);
    console.log(`   In map:   ${Object.keys(map).length}`);
  }

  // ── Rewrite post JSONs ──
  console.log(`\n🔄 Rewriting ${postFiles.length} post JSONs to use R2 URLs…`);
  let rewritten = 0;
  for (const f of postFiles) {
    const fp = path.join(IN_DIR, f);
    const data = JSON.parse(await fsp.readFile(fp, "utf8"));
    let changed = false;

    // Featured image
    const fi = normalizeImageUrl(data.featuredImage);
    if (fi && map[fi] && map[fi] !== data.featuredImage) {
      data.featuredImage = map[fi];
      changed = true;
    }

    // Inline body images
    if (data.bodyHtml) {
      const newHtml = data.bodyHtml.replace(/(<img[^>]+src=")([^"]+)(")/gi, (_, pre, src, post) => {
        const norm = normalizeImageUrl(src);
        const replacement = map[norm];
        return replacement ? `${pre}${replacement}${post}` : `${pre}${src}${post}`;
      });
      if (newHtml !== data.bodyHtml) {
        data.bodyHtml = newHtml;
        changed = true;
      }
    }

    // Inline image inventory (regenerate from the new HTML).
    if (changed) {
      const fresh = new Set();
      for (const m of (data.bodyHtml || "").matchAll(/<img[^>]+src="([^"]+)"/gi)) {
        fresh.add(normalizeImageUrl(m[1]));
      }
      data.inlineImages = [...fresh];
      await fsp.writeFile(fp, JSON.stringify(data, null, 2), "utf8");
      rewritten++;
    }
  }
  console.log(`   Rewritten: ${rewritten} / ${postFiles.length} posts`);
  console.log(`\n✓ Done.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
