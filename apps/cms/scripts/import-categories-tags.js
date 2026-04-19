/**
 * Import tags from Shopify CSV as subcategories and link products to them.
 * Usage: node scripts/import-categories-tags.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH    = path.resolve(__dirname, "products_export_1.csv");
const PAYLOAD_URL = "http://localhost:3001";
const ADMIN_EMAIL = "abdalhmeed.dradkeh@gmail.com";
const ADMIN_PASS  = "@Bd.dradkeh1";

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s\u0600-\u06FF-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const { token } = await res.json();
  if (!token) throw new Error("No token");
  return token;
}

async function getOrCreateCategory(token, name, cache) {
  if (cache[name]) return cache[name];
  const res = await fetch(`${PAYLOAD_URL}/api/categories?limit=200`, {
    headers: { Authorization: `JWT ${token}` },
  });
  const data = await res.json();
  const existing = (data.docs || []).find(c => c.nameEn === name || c.nameAr === name);
  if (existing) { cache[name] = existing.id; return existing.id; }

  const create = await fetch(`${PAYLOAD_URL}/api/categories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify({ nameAr: name, nameEn: name, slug: slugify(name), isActive: true }),
  });
  const created = await create.json();
  const id = created.doc?.id || created.id;
  cache[name] = id;
  return id;
}

async function getOrCreateSubcategory(token, name, categoryId, cache) {
  const key = `${categoryId}::${name}`;
  if (cache[key]) return cache[key];

  const res = await fetch(`${PAYLOAD_URL}/api/subcategories?limit=500`, {
    headers: { Authorization: `JWT ${token}` },
  });
  const data = await res.json();
  const existing = (data.docs || []).find(s => s.nameEn === name || s.nameAr === name);
  if (existing) { cache[key] = existing.id; return existing.id; }

  const slug = slugify(name);
  if (!slug) return null;

  const create = await fetch(`${PAYLOAD_URL}/api/subcategories`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify({
      nameAr: name,
      nameEn: name,
      slug: slug + "-" + Date.now(),
      category: categoryId,
      isActive: true,
      position: 0,
    }),
  });
  if (!create.ok) {
    console.error(`  ✗ Subcategory create failed (${create.status}): ${(await create.text()).slice(0, 150)}`);
    return null;
  }
  const created = await create.json();
  const id = created.doc?.id || created.id;
  cache[key] = id;
  return id;
}

async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function fetchWithRetry(url, options, retries = 5) {
  for (let i = 0; i < retries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429) {
      const wait = (i + 1) * 2000;
      process.stdout.write(` [rate-limited, waiting ${wait/1000}s] `);
      await new Promise(r => setTimeout(r, wait));
      continue;
    }
    return res;
  }
  throw new Error("Too many retries due to rate limiting");
}

async function getProductBySlug(token, slug) {
  const res = await fetchWithRetry(
    `${PAYLOAD_URL}/api/products?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
    { headers: { Authorization: `JWT ${token}` } }
  );
  const data = await safeJson(res);
  return data?.docs?.[0] || null;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`❌ CSV not found: ${CSV_PATH}`);
    process.exit(1);
  }

  console.log("🔐 Logging in...");
  const token = await login();
  console.log("✓ Logged in\n");

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  // Deduplicate rows by handle (take first row per product)
  const seen = new Set();
  const products = rows.filter(r => {
    if (!r["Handle"] || seen.has(r["Handle"])) return false;
    seen.add(r["Handle"]);
    return true;
  });

  console.log(`📦 ${products.length} unique products in CSV\n`);

  // Collect all unique tags and map handle → tags
  const allTags = new Set();
  const handleTags = {};
  for (const r of rows) {
    const handle = r["Handle"];
    const type = r["Type"] || "General";
    const tags = (r["Tags"] || "").split(",").map(t => t.trim()).filter(Boolean);
    if (handle) {
      handleTags[handle] = { tags, type };
      tags.forEach(t => allTags.add(t));
    }
  }

  console.log(`🏷  ${allTags.size} unique tags found\n`);

  const catCache = {};
  const subCache = {};

  // Step 1: Create all subcategories under a "General" parent category
  console.log("── Step 1: Creating subcategories ──");
  const generalCatId = await getOrCreateCategory(token, "General", catCache);
  console.log(`  ✓ Parent category "General" ready (id: ${generalCatId})\n`);

  let subCreated = 0;
  for (const tag of allTags) {
    process.stdout.write(`  + ${tag.slice(0, 50)} … `);
    const id = await getOrCreateSubcategory(token, tag, generalCatId, subCache);
    if (id) { console.log("✓"); subCreated++; }
    else console.log("skipped");
    await new Promise(r => setTimeout(r, 400));
  }
  console.log(`\n  ✓ ${subCreated} subcategories ready\n`);

  // Step 2: Update each product — set category + first tag as subcategory
  console.log("── Step 2: Linking products to subcategories ──\n");
  let linked = 0, failed = 0;

  for (const row of products) {
    const handle = row["Handle"];
    const { tags, type } = handleTags[handle] || { tags: [], type: "General" };
    const firstTag = tags[0];

    if (!firstTag) {
      console.log(`– ${handle}: no tags, skipping`);
      continue;
    }

    const product = await getProductBySlug(token, handle);
    if (!product) {
      console.log(`– ${handle}: product not found in Payload`);
      failed++;
      continue;
    }

    const catId = await getOrCreateCategory(token, type || "General", catCache);
    const subId = subCache[`${generalCatId}::${firstTag}`];

    if (!subId) {
      console.log(`– ${handle}: subcategory not found for tag "${firstTag}"`);
      failed++;
      continue;
    }

    const patchRes = await fetchWithRetry(`${PAYLOAD_URL}/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
      body: JSON.stringify({ category: catId, subcategory: subId }),
    });

    if (patchRes.ok) {
      console.log(`✓ ${row["Title"] || handle} → "${firstTag}"`);
      linked++;
    } else {
      const body = await patchRes.text();
      console.log(`✗ ${handle}: PATCH failed (${patchRes.status}): ${body.slice(0, 100)}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 500));
  }

  console.log(`\n✅ Done — ${linked} products linked, ${failed} failed`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
