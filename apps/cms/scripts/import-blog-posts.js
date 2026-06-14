/**
 * Import every exported Shopify blog post into Payload as a Posts doc.
 *
 * Reads `blogs_export/posts/<slug>.json` (produced by export-shopify-blogs.js)
 * and POSTs each one to Payload's REST API. Idempotent: if a post with the
 * same slug already exists, it's PATCHed instead of recreated.
 *
 * Image strategy: featured + inline images stay as their original Shopify
 * CDN URLs. Migrate to R2 later with migrate-blog-images.js (TODO) once
 * S3 credentials are configured locally — until then the live storefront
 * pulls from Shopify CDN, which is fine while Shopify is still active.
 *
 * Prereqs:
 *   1. CMS is running (default: http://localhost:3001)
 *   2. Posts collection schema is deployed
 *   3. Posts table exists (hit GET /api/migrate first if not)
 *
 * Usage:
 *   node scripts/import-blog-posts.js                           # full import
 *   node scripts/import-blog-posts.js --limit 5                 # smoke test
 *   node scripts/import-blog-posts.js --skip-existing           # don't overwrite
 *   node scripts/import-blog-posts.js --cms http://localhost:3001
 */

const fs = require("node:fs");
const path = require("node:path");

const args = require("node:util").parseArgs({
  options: {
    cms:           { type: "string",  default: "http://localhost:3001" },
    email:         { type: "string",  default: "abdalhmeed.dradkeh@gmail.com" },
    password:      { type: "string",  default: "@Bd.dradkeh1" },
    in:            { type: "string",  default: path.resolve(__dirname, "blogs_export/posts") },
    limit:         { type: "string" },
    "skip-existing":{ type: "boolean", default: false },
    concurrency:   { type: "string",  default: "4" },
  },
  strict: false,
}).values;

const CMS = String(args.cms).replace(/\/$/, "");
const IN_DIR = String(args.in);
const LIMIT = args.limit ? parseInt(String(args.limit), 10) : null;
const SKIP_EXISTING = Boolean(args["skip-existing"]);
const CONCURRENCY = parseInt(String(args.concurrency), 10) || 4;

async function login() {
  const res = await fetch(`${CMS}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: args.email, password: args.password }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const json = await res.json();
  return json.token;
}

async function findExistingBySlug(token, slug) {
  const url = `${CMS}/api/posts?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`;
  const res = await fetch(url, { headers: { Authorization: `JWT ${token}` } });
  if (!res.ok) return null;
  const json = await res.json();
  return json.docs?.[0] || null;
}

/** Map our JSON shape → Payload doc. */
function toPayloadDoc(post) {
  const tagsArr = (post.tags || []).filter(Boolean).map((tag) => ({ tag }));
  // Payload's `date` field wants an ISO string. Some Shopify dates are
  // "2026-01-12" only; new Date() handles both.
  const publishedAt = post.publishedAt ? new Date(post.publishedAt).toISOString() : undefined;
  return {
    title: post.title,
    slug: post.slug,
    excerpt: post.excerpt || undefined,
    featuredImageUrl: post.featuredImage || undefined,
    bodyHtml: post.bodyHtml,
    publishedAt,
    author: post.author || undefined,
    tags: tagsArr,
    status: "published",
    sourceUrl: post.url,
  };
}

async function upsertPost(token, post) {
  const doc = toPayloadDoc(post);
  const existing = await findExistingBySlug(token, post.slug);

  if (existing && SKIP_EXISTING) {
    return { slug: post.slug, status: "skipped-existing" };
  }

  if (existing) {
    const res = await fetch(`${CMS}/api/posts/${existing.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
      body: JSON.stringify(doc),
    });
    if (!res.ok) return { slug: post.slug, status: "patch-failed", code: res.status, body: (await res.text()).slice(0, 200) };
    return { slug: post.slug, status: "updated" };
  }

  const res = await fetch(`${CMS}/api/posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(doc),
  });
  if (!res.ok) return { slug: post.slug, status: "create-failed", code: res.status, body: (await res.text()).slice(0, 200) };
  return { slug: post.slug, status: "created" };
}

async function runWithConcurrency(items, fn, limit) {
  const out = new Array(items.length);
  let i = 0;
  async function worker() {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx], idx); }
      catch (e) { out[idx] = { error: e.message }; }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return out;
}

async function main() {
  console.log(`🔐 Logging in to ${CMS}…`);
  const token = await login();
  console.log(`✓ Logged in.\n`);

  const files = fs.readdirSync(IN_DIR).filter((f) => f.endsWith(".json"));
  const slice = LIMIT ? files.slice(0, LIMIT) : files;
  console.log(`📂 Found ${files.length} exported posts.  Importing ${slice.length}…`);

  let done = 0;
  const results = await runWithConcurrency(slice, async (file) => {
    const post = JSON.parse(fs.readFileSync(path.join(IN_DIR, file), "utf8"));
    const r = await upsertPost(token, post);
    done++;
    const tag =
      r.status === "created" ? "+"
      : r.status === "updated" ? "↻"
      : r.status === "skipped-existing" ? "↩"
      : "✗";
    console.log(`  ${tag} [${done}/${slice.length}] ${r.slug} (${r.status})${r.code ? ` ${r.code}` : ""}`);
    return r;
  }, CONCURRENCY);

  // ── Summary ──
  const created = results.filter((r) => r?.status === "created").length;
  const updated = results.filter((r) => r?.status === "updated").length;
  const skipped = results.filter((r) => r?.status === "skipped-existing").length;
  const failed = results.filter((r) => r && r.status !== "created" && r.status !== "updated" && r.status !== "skipped-existing");

  console.log(`\n── Summary ──`);
  console.log(`   Created:   ${created}`);
  console.log(`   Updated:   ${updated}`);
  console.log(`   Skipped:   ${skipped}`);
  console.log(`   Failed:    ${failed.length}`);
  if (failed.length) {
    console.log(`\n❌ Failures (first 10):`);
    for (const f of failed.slice(0, 10)) console.log(`   - ${f.slug}: ${f.status} ${f.code || ""} ${f.body || ""}`);
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
