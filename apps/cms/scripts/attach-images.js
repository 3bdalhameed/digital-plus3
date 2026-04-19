/**
 * Attach images to existing products from a Shopify CSV export.
 * Usage: node scripts/attach-images.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH    = path.resolve(__dirname, "products_export_1.csv");
const PAYLOAD_URL = "http://localhost:3001";
const ADMIN_EMAIL = "abdalhmeed.dradkeh@gmail.com";
const ADMIN_PASS  = "@Bd.dradkeh1";

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

async function uploadImage(token, imageUrl) {
  if (!imageUrl || !imageUrl.startsWith("http")) return null;
  try {
    const imgRes = await fetch(imageUrl);
    if (!imgRes.ok) {
      console.error(`    ✗ Download failed (${imgRes.status}): ${imageUrl.slice(0, 80)}`);
      return null;
    }
    const arrayBuffer = await imgRes.arrayBuffer();
    const contentType = imgRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.includes("png") ? "png" : contentType.includes("webp") ? "webp" : "jpg";
    const filename = `product-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
      console.error(`    ✗ Upload failed (${uploadRes.status}): ${(await uploadRes.text()).slice(0, 200)}`);
      return null;
    }
    const data = await uploadRes.json();
    return data.doc?.id || data.id || null;
  } catch (err) {
    console.error(`    ✗ Error: ${err.message}`);
    return null;
  }
}

async function getAllProducts(token) {
  let page = 1, all = [];
  while (true) {
    const res = await fetch(`${PAYLOAD_URL}/api/products?limit=100&page=${page}&depth=0`, {
      headers: { Authorization: `JWT ${token}` },
    });
    const data = await res.json();
    all = all.concat(data.docs || []);
    if (page >= data.totalPages) break;
    page++;
  }
  return all;
}

async function main() {
  if (!fs.existsSync(CSV_PATH)) {
    console.error(`\n❌ CSV not found: ${CSV_PATH}\n`);
    process.exit(1);
  }

  console.log("🔐 Logging in...");
  const token = await login();
  console.log("✓ Logged in\n");

  // Build slug → image URL map from CSV
  const raw = fs.readFileSync(CSV_PATH, "utf8");
  const rows = parse(raw, { columns: true, skip_empty_lines: true, trim: true });

  const imageMap = {};
  for (const row of rows) {
    const handle = row["Handle"];
    const imgSrc = row["Image Src"] || row["Variant Image"] || "";
    if (handle && imgSrc && !imageMap[handle]) imageMap[handle] = imgSrc;
  }
  console.log(`📷 ${Object.keys(imageMap).length} image URLs found in CSV\n`);

  // Get all products from Payload
  console.log("📦 Fetching all products...");
  const products = await getAllProducts(token);
  console.log(`✓ ${products.length} products found\n`);

  // Filter: only products with no images
  const noImage = products.filter(p => !p.images || p.images.length === 0);
  console.log(`🖼  ${noImage.length} products need images\n`);

  let success = 0, skipped = 0, failed = 0;

  for (const product of noImage) {
    const slug = product.slug;
    const imageUrl = imageMap[slug];

    if (!imageUrl) {
      console.log(`– ${slug}: no image URL in CSV`);
      skipped++;
      continue;
    }

    process.stdout.write(`→ ${product.nameAr || slug} … `);

    const mediaId = await uploadImage(token, imageUrl);
    if (!mediaId) {
      console.log("skipped (upload failed)");
      failed++;
      continue;
    }

    // PATCH product with image
    const patchRes = await fetch(`${PAYLOAD_URL}/api/products/${product.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `JWT ${token}`,
      },
      body: JSON.stringify({ images: [{ image: mediaId }] }),
    });

    if (patchRes.ok) {
      console.log("✓ image attached");
      success++;
    } else {
      const body = await patchRes.text();
      console.log(`✗ PATCH failed (${patchRes.status}): ${body.slice(0, 150)}`);
      failed++;
    }

    // Small delay to avoid hammering the server
    await new Promise(r => setTimeout(r, 300));
  }

  console.log(`\n✅ Done — ${success} attached, ${skipped} skipped (no CSV image), ${failed} failed`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
