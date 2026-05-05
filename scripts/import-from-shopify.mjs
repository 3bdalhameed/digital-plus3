/**
 * Shopify → Payload CMS product importer
 *
 * Usage:
 *   node scripts/import-from-shopify.mjs products_export.csv
 *
 * Env vars (or edit the defaults below):
 *   CMS_URL      — e.g. https://cms-production-27da.up.railway.app
 *   CMS_EMAIL    — admin email
 *   CMS_PASSWORD — admin password
 */

import fs from "fs";
import path from "path";
import https from "https";
import http from "http";
import { parse } from "csv-parse/sync";
import FormData from "form-data";

// ── Config ────────────────────────────────────────────────────────────────────
const CMS_URL   = process.env.CMS_URL      || "http://localhost:3001";
const EMAIL     = process.env.CMS_EMAIL    || "admin@example.com";
const PASSWORD  = process.env.CMS_PASSWORD || "password";

// Shopify type → Payload type mapping (edit as needed)
const TYPE_MAP = {
  "subscription":       "software_subscription",
  "software":           "software_subscription",
  "اشتراك":             "software_subscription",
  "license":            "license_key",
  "ترخيص":              "license_key",
  "gaming":             "gaming_card",
  "game":               "gaming_card",
  "العاب":              "gaming_card",
  "ai":                 "ai_subscription",
  "artificial":         "ai_subscription",
  "invitation":         "invitation",
  "دعوة":               "invitation",
};

function mapType(shopifyType = "") {
  const lower = shopifyType.toLowerCase();
  for (const [key, val] of Object.entries(TYPE_MAP)) {
    if (lower.includes(key)) return val;
  }
  return "software_subscription"; // default
}

// ── Helpers ───────────────────────────────────────────────────────────────────
async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${CMS_URL}/api${endpoint}`, {
    headers: { "Content-Type": "application/json", ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${endpoint} → ${res.status}: ${text.slice(0, 200)}`);
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
  console.log("✅ Logged in");
  return data.token;
}

function downloadBuffer(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith("https") ? https : http;
    lib.get(url, (res) => {
      const chunks = [];
      res.on("data", (c) => chunks.push(c));
      res.on("end", () => resolve(Buffer.concat(chunks)));
      res.on("error", reject);
    }).on("error", reject);
  });
}

async function uploadImage(imageUrl, altText, token) {
  try {
    console.log(`  📷 Uploading image: ${imageUrl.slice(0, 60)}…`);
    const buffer = await downloadBuffer(imageUrl);
    const filename = path.basename(new URL(imageUrl).pathname).split("?")[0] || "image.jpg";

    const form = new FormData();
    form.append("file", buffer, { filename, contentType: "image/jpeg" });
    if (altText) form.append("alt", altText);

    const res = await fetch(`${CMS_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `JWT ${token}`, ...form.getHeaders() },
      body: form,
    });
    if (!res.ok) {
      console.warn(`  ⚠️  Image upload failed (${res.status}) — skipping`);
      return null;
    }
    const data = await res.json();
    return data.doc?.id ?? null;
  } catch (err) {
    console.warn(`  ⚠️  Image error: ${err.message} — skipping`);
    return null;
  }
}

// ── Parse Shopify CSV ─────────────────────────────────────────────────────────
function parseShopifyCSV(csvPath) {
  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, bom: true });

  // Group rows by Handle (one product = multiple rows for variants/images)
  const products = new Map();

  for (const row of rows) {
    const handle = row["Handle"]?.trim();
    if (!handle) continue;

    if (!products.has(handle)) {
      products.set(handle, {
        handle,
        title:           row["Title"]?.trim() || "",
        bodyHtml:        row["Body (HTML)"]?.trim() || "",
        vendor:          row["Vendor"]?.trim() || "",
        type:            row["Type"]?.trim() || "",
        tags:            row["Tags"]?.trim() || "",
        published:       row["Published"]?.trim().toLowerCase() === "true",
        seoTitle:        row["SEO Title"]?.trim() || "",
        seoDescription:  row["SEO Description"]?.trim() || "",
        price:           parseFloat(row["Variant Price"] || "0") || 0,
        comparePrice:    parseFloat(row["Variant Compare At Price"] || "0") || 0,
        images:          [],
      });
    }

    const product = products.get(handle);

    // Collect images (each row may add one)
    const imgSrc = row["Image Src"]?.trim();
    if (imgSrc && !product.images.find((i) => i.src === imgSrc)) {
      product.images.push({ src: imgSrc, alt: row["Image Alt Text"]?.trim() || "" });
    }

    // Take the lowest price if multiple variants
    const variantPrice = parseFloat(row["Variant Price"] || "0");
    if (variantPrice > 0 && variantPrice < product.price) product.price = variantPrice;
  }

  return [...products.values()];
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  const csvPath = process.argv[2];
  if (!csvPath) {
    console.error("Usage: node scripts/import-from-shopify.mjs <path-to-shopify-export.csv>");
    process.exit(1);
  }
  if (!fs.existsSync(csvPath)) {
    console.error(`File not found: ${csvPath}`);
    process.exit(1);
  }

  const token = await login();
  const products = parseShopifyCSV(csvPath);
  console.log(`\n📦 Found ${products.length} products in CSV\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const p of products) {
    console.log(`→ [${created + skipped + failed + 1}/${products.length}] ${p.title || p.handle}`);

    // Upload images
    const imageIds = [];
    for (const img of p.images.slice(0, 5)) { // max 5 images per product
      const id = await uploadImage(img.src, img.alt, token);
      if (id) imageIds.push(id);
    }

    const payload = {
      nameAr:          p.title,
      nameEn:          p.title,
      slug:            p.handle,
      descriptionHtml: p.bodyHtml,
      type:            mapType(p.type),
      deliveryMethod:  "email",
      price:           p.price || 0,
      comparePrice:    p.comparePrice > p.price ? p.comparePrice : undefined,
      currency:        "USD",
      status:          p.published ? "published" : "draft",
      refundable:      false,
      usageProofType:  "subscription_activated",
      images:          imageIds.map((id) => ({ image: id })),
      seoTitle:        p.seoTitle || undefined,
      seoDescription:  p.seoDescription || undefined,
    };

    try {
      await apiFetch("/products", {
        method: "POST",
        headers: { Authorization: `JWT ${token}` },
        body: JSON.stringify(payload),
      });
      console.log(`  ✅ Created (${imageIds.length} images)`);
      created++;
    } catch (err) {
      if (err.message.includes("duplicate") || err.message.includes("unique") || err.message.includes("slug")) {
        console.log(`  ⏭️  Skipped — slug "${p.handle}" already exists`);
        skipped++;
      } else {
        console.error(`  ❌ Failed: ${err.message}`);
        failed++;
      }
    }
  }

  console.log(`\n🎉 Done! Created: ${created}  Skipped: ${skipped}  Failed: ${failed}`);
}

main().catch((err) => { console.error(err); process.exit(1); });
