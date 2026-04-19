/**
 * Import products + images from a Shopify CSV export into Payload CMS.
 * Usage: node scripts/import-shopify-csv.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

// ── Config ──────────────────────────────────────────────
const CSV_PATH    = path.resolve(__dirname, "products_export_1.csv");
const PAYLOAD_URL = "http://localhost:3001";
const ADMIN_EMAIL = "abdalhmeed.dradkeh@gmail.com";
const ADMIN_PASS  = "@Bd.dradkeh1";
// ────────────────────────────────────────────────────────

function slugify(str) {
  return str.toLowerCase().trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function mapType(productType) {
  const t = (productType || "").toLowerCase();
  if (t.includes("subscription") || t.includes("اشتراك")) return "software_subscription";
  if (t.includes("key") || t.includes("license") || t.includes("مفتاح")) return "license_key";
  if (t.includes("game") || t.includes("card") || t.includes("بطاقة")) return "gaming_card";
  if (t.includes("ai") || t.includes("ذكاء")) return "ai_subscription";
  if (t.includes("invitation") || t.includes("دعوة")) return "invitation";
  return "license_key";
}

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  if (!res.ok) throw new Error(`Login failed: ${res.status} ${await res.text()}`);
  const { token } = await res.json();
  if (!token) throw new Error("No token — check your email/password");
  return token;
}

async function uploadImage(token, imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("http")) return null;

  try {
    // Download the image
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) return null;

    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `product-${Date.now()}.${ext}`;

    // Upload to Payload media using native FormData + Blob (Node 22 compatible)
    const blob = new Blob([arrayBuffer], { type: contentType });
    const form = new FormData();
    form.append("file", blob, filename);
    form.append("alt", "product image");

    const uploadRes = await fetch(`${PAYLOAD_URL}/api/media`, {
      method: "POST",
      headers: { Authorization: `JWT ${token}` },
      body: form,
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text();
      console.error(`    ⚠ Image upload failed (${uploadRes.status}): ${errBody.slice(0, 300)}`);
      return null;
    }

    const data = await uploadRes.json();
    return data.doc?.id || data.id || null;
  } catch (err) {
    console.error(`    ⚠ Image error: ${err.message}`);
    return null;
  }
}

async function getOrCreateCategory(token, name, cache) {
  if (cache[name]) return cache[name];

  const res = await fetch(`${PAYLOAD_URL}/api/categories?limit=100`, {
    headers: { Authorization: `JWT ${token}` },
  });
  const data = await res.json();
  const existing = (data.docs || []).find((c) => c.nameEn === name || c.nameAr === name);
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

async function findProductBySlug(token, slug) {
  const res = await fetch(`${PAYLOAD_URL}/api/products?where[slug][equals]=${slug}&limit=1`, {
    headers: { Authorization: `JWT ${token}` },
  });
  const data = await res.json();
  return data.docs?.[0] || null;
}

async function updateProduct(token, id, data) {
  const res = await fetch(`${PAYLOAD_URL}/api/products/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`  ✗ Update failed (${res.status}): ${body.slice(0, 200)}`);
  } else {
    console.log(`  ✓ Image attached`);
  }
}

async function createProduct(token, data) {
  const res = await fetch(`${PAYLOAD_URL}/api/products`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const body = await res.text();
    console.error(`  ✗ Failed (${res.status}): ${body.slice(0, 200)}`);
  } else {
    console.log(`  ✓ Created`);
  }
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV not found at: ${CSV_PATH}\n`);
    process.exit(1);
  }

  console.log("🔐 Logging in...");
  const token = await login();
  console.log("✓ Logged in\n");

  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  // Build image map: handle → first image URL (Shopify repeats image per variant row)
  const imageMap = {};
  for (const row of rows) {
    const handle = row["Handle"];
    const imgSrc = row["Image Src"] || row["Variant Image"] || "";
    if (handle && imgSrc && !imageMap[handle]) imageMap[handle] = imgSrc;
  }

  // Deduplicate products by Handle
  const seen = new Set();
  const products = rows.filter((row) => {
    if (!row["Handle"] || seen.has(row["Handle"])) return false;
    seen.add(row["Handle"]);
    return true;
  });

  console.log(`📦 ${products.length} unique products found\n`);

  const categoryCache = {};
  let success = 0, fail = 0;

  for (const row of products) {
    const title   = row["Title"] || row["Name"] || "Untitled";
    const handle  = row["Handle"] || slugify(title);
    const price   = parseFloat(row["Variant Price"] || row["Price"] || "0") || 0;
    const compare = parseFloat(row["Variant Compare At Price"] || row["Compare At Price"] || "0") || 0;
    const status  = (row["Status"] || "").toLowerCase() === "active" ? "published" : "draft";
    const type    = mapType(row["Type"] || row["Product Type"] || "");
    const catName = row["Type"] || row["Product Type"] || "General";

    console.log(`→ ${title}`);

    // Category
    const categoryId = await getOrCreateCategory(token, catName, categoryCache);

    // Image
    const imageUrl = imageMap[handle];
    let images = [];
    if (imageUrl) {
      process.stdout.write(`  ⬇ Downloading image...`);
      const mediaId = await uploadImage(token, imageUrl);
      if (mediaId) {
        images = [{ image: mediaId }];
        process.stdout.write(` ✓\n`);
      } else {
        process.stdout.write(` skipped\n`);
      }
    }

    const payload = {
      nameAr: title,
      nameEn: title,
      slug: handle,
      price,
      currency: "USD",
      status,
      type,
      deliveryMethod: "email",
      refundable: false,
      usageProofType: "first_login",
      category: categoryId,
      ...(images.length ? { images } : {}),
      ...(compare > price ? { comparePrice: compare } : {}),
    };

    try {
      const existing = await findProductBySlug(token, handle);
      if (existing) {
        // Product exists — just update its images
        if (images.length) {
          await updateProduct(token, existing.id, { images });
        } else {
          console.log(`  – No image to attach`);
        }
      } else {
        await createProduct(token, payload);
      }
      success++;
    } catch (err) {
      console.error(`  ✗ Error: ${err}`);
      fail++;
    }

    await new Promise((r) => setTimeout(r, 200));
  }

  console.log(`\n✅ Done — ${success} imported, ${fail} failed`);
}

main().catch((err) => { console.error("Fatal:", err); process.exit(1); });
