/**
 * Update product descriptions in Payload CMS from a Shopify CSV export
 *
 * Usage:
 *   node scripts/update-descriptions-from-shopify.mjs products_export.csv
 *
 * Env vars:
 *   CMS_URL      — e.g. https://cms-production-27da.up.railway.app
 *   CMS_EMAIL    — admin email
 *   CMS_PASSWORD — admin password
 */

import fs from "fs";
import { parse } from "csv-parse/sync";

const CMS_URL  = process.env.CMS_URL      || "http://localhost:3001";
const EMAIL    = process.env.CMS_EMAIL    || "admin@example.com";
const PASSWORD = process.env.CMS_PASSWORD || "password";

// ── Helpers ───────────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${CMS_URL}/api${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${endpoint} → ${res.status}: ${text.slice(0, 300)}`);
  }
  return res.json();
}

async function login() {
  console.log(`🔐 Logging in as ${EMAIL}…`);
  const data = await apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  if (!data.token) throw new Error("Login failed — check CMS_EMAIL and CMS_PASSWORD");
  console.log("✅ Logged in\n");
  return data.token;
}

async function findProductBySlug(slug, token) {
  const data = await apiFetch(
    `/products?where[slug][equals]=${encodeURIComponent(slug)}&limit=1&depth=0`,
    { headers: { Authorization: `JWT ${token}` } }
  );
  return data.docs?.[0] ?? null;
}

async function updateProduct(id, patch, token) {
  return apiFetch(`/products/${id}`, {
    method: "PATCH",
    headers: { Authorization: `JWT ${token}` },
    body: JSON.stringify(patch),
  });
}

// ── Parse Shopify CSV — one row per variant, group by Handle ─────────────────
function parseShopifyCSV(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true });

  const products = new Map();
  for (const row of rows) {
    const handle = row["Handle"]?.trim();
    if (!handle) continue;
    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        bodyHtml:       row["Body (HTML)"]?.trim() || "",
        seoTitle:       row["SEO Title"]?.trim() || "",
        seoDescription: row["SEO Description"]?.trim() || "",
      });
    }
  }
  return [...products.values()];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/update-descriptions-from-shopify.mjs <shopify-export.csv>");
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const token   = await login();
  const products = parseShopifyCSV(csvPath);
  console.log(`📦 Found ${products.length} products in CSV\n`);

  let updated = 0, notFound = 0, noDesc = 0, failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    process.stdout.write(`[${i + 1}/${products.length}] ${p.handle} … `);

    if (!p.bodyHtml && !p.seoTitle && !p.seoDescription) {
      console.log("⏭️  no description in CSV — skipped");
      noDesc++;
      continue;
    }

    let existing;
    try {
      existing = await findProductBySlug(p.handle, token);
    } catch (err) {
      console.log(`❌ lookup failed: ${err.message}`);
      failed++;
      continue;
    }

    if (!existing) {
      console.log("⚠️  not found in CMS — skipped");
      notFound++;
      continue;
    }

    const patch = {};
    if (p.bodyHtml)       patch.descriptionHtml = p.bodyHtml;
    if (p.seoTitle)       patch.seoTitle        = p.seoTitle;
    if (p.seoDescription) patch.seoDescription  = p.seoDescription;

    try {
      await updateProduct(existing.id, patch, token);
      console.log("✅ updated");
      updated++;
    } catch (err) {
      console.log(`❌ update failed: ${err.message}`);
      failed++;
    }
  }

  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Updated   : ${updated}
⚠️  Not found : ${notFound}
⏭️  No desc   : ${noDesc}
❌ Failed    : ${failed}
━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
}

main().catch((err) => { console.error(err); process.exit(1); });
