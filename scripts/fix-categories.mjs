/**
 * Category fixer for Payload CMS
 *
 * Usage:
 *   node scripts/fix-categories.mjs --list
 *   node scripts/fix-categories.mjs --rename <old-slug> "<New Arabic Name>" [<new-slug>]
 *   node scripts/fix-categories.mjs --resync-slugs
 *
 * Env vars (or edit the defaults below):
 *   CMS_URL      — e.g. https://your-cms.up.railway.app
 *   CMS_EMAIL    — admin email
 *   CMS_PASSWORD — admin password
 */

const CMS_URL  = process.env.CMS_URL      || "http://localhost:3001";
const EMAIL    = process.env.CMS_EMAIL    || "admin@example.com";
const PASSWORD = process.env.CMS_PASSWORD || "password";

// ── HTTP helper ──────────────────────────────────────────────────────────────

async function apiFetch(path, opts = {}) {
  const url = `${CMS_URL}${path}`;
  const res = await fetch(url, {
    ...opts,
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}: ${text}`);
  return JSON.parse(text);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

let token = null;

async function login() {
  const data = await apiFetch("/api/users/login", {
    method: "POST",
    body: { email: EMAIL, password: PASSWORD },
  });
  token = data.token;
  if (!token) throw new Error("Login failed — check CMS_EMAIL / CMS_PASSWORD");
  console.log("✓ Logged in to CMS");
}

function auth() {
  return { Authorization: `JWT ${token}` };
}

// ── Fetch helpers ────────────────────────────────────────────────────────────

async function getAllCategories() {
  const data = await apiFetch("/api/categories?limit=200&depth=0", { headers: auth() });
  return data.docs ?? [];
}

async function getAllSubcategories() {
  const data = await apiFetch("/api/subcategories?limit=500&depth=1", { headers: auth() });
  return data.docs ?? [];
}

async function getProductsForCategory(categorySlug, page = 1) {
  const where = encodeURIComponent(JSON.stringify({ "category.slug": { equals: categorySlug }, status: { equals: "published" } }));
  const data = await apiFetch(`/api/products?where=${where}&limit=5&page=${page}&depth=0`, { headers: auth() });
  return data;
}

async function getAllProducts(page = 1, limit = 100) {
  const data = await apiFetch(`/api/products?limit=${limit}&page=${page}&depth=1`, { headers: auth() });
  return data;
}

// ── Commands ─────────────────────────────────────────────────────────────────

async function cmdList() {
  const [categories, subcategories] = await Promise.all([getAllCategories(), getAllSubcategories()]);

  console.log("\n══════════════════════════════════════════");
  console.log("  CATEGORIES");
  console.log("══════════════════════════════════════════");

  for (const cat of categories) {
    const subs = subcategories.filter((s) => {
      const c = s.category;
      return typeof c === "object" ? c?.id === cat.id : c === cat.id;
    });

    // Fetch product count for this category
    let productCount = 0;
    let sampleNames = [];
    try {
      const res = await getProductsForCategory(cat.slug);
      productCount = res.totalDocs ?? 0;
      sampleNames = (res.docs ?? []).slice(0, 3).map((p) => p.nameAr ?? p.name);
    } catch {}

    const isActive = cat.isActive !== false ? "✓" : "✗";
    console.log(`\n  [${isActive}] "${cat.nameAr}" (id=${cat.id})`);
    console.log(`       slug: ${cat.slug}`);
    console.log(`       products: ${productCount} | subcategories: ${subs.length}`);
    if (sampleNames.length) console.log(`       sample products: ${sampleNames.join(", ")}`);
    if (subs.length) console.log(`       subcategories: ${subs.map((s) => s.nameAr).join(", ")}`);
  }

  console.log("\n══════════════════════════════════════════\n");
}

async function cmdRename(oldSlug, newNameAr, newSlug) {
  const categories = await getAllCategories();
  const cat = categories.find((c) => c.slug === oldSlug);
  if (!cat) {
    console.error(`✗ No category with slug "${oldSlug}" found.`);
    process.exit(1);
  }

  const update = { nameAr: newNameAr };
  if (newSlug) update.slug = newSlug;

  await apiFetch(`/api/categories/${cat.id}`, {
    method: "PATCH",
    headers: auth(),
    body: update,
  });

  console.log(`✓ Updated category "${oldSlug}" → nameAr="${newNameAr}"${newSlug ? `, slug="${newSlug}"` : ""}`);

  if (newSlug) {
    console.log(`  ℹ Slug changed — re-syncing categorySlug on all products in this category...`);
    await resyncProductsForCategory(cat.id);
  }
}

async function resyncProductsForCategory(categoryId) {
  // Fetch all products that belong to this category (by relationship)
  const where = encodeURIComponent(JSON.stringify({ category: { equals: categoryId } }));
  let page = 1;
  let totalUpdated = 0;

  while (true) {
    const data = await apiFetch(
      `/api/products?where=${where}&limit=50&page=${page}&depth=0`,
      { headers: auth() }
    );
    const docs = data.docs ?? [];
    if (!docs.length) break;

    for (const product of docs) {
      // Re-save the product to trigger the beforeChange hook which re-writes categorySlug
      await apiFetch(`/api/products/${product.id}`, {
        method: "PATCH",
        headers: auth(),
        body: { _resync: true }, // any no-op field triggers the hook
      });
      totalUpdated++;
    }

    if (!data.hasNextPage) break;
    page++;
  }

  console.log(`  ✓ Re-synced ${totalUpdated} products`);
}

async function cmdResyncAll() {
  console.log("Re-syncing categorySlug / subcategorySlug on all products...\n");
  let page = 1;
  let total = 0;

  while (true) {
    const data = await getAllProducts(page, 50);
    const docs = data.docs ?? [];
    if (!docs.length) break;

    for (const product of docs) {
      try {
        // Re-save each product so the beforeChange hook runs and updates
        // the denormalized categorySlug / subcategorySlug fields
        await apiFetch(`/api/products/${product.id}`, {
          method: "PATCH",
          headers: auth(),
          body: {},
        });
        process.stdout.write(".");
        total++;
      } catch (err) {
        process.stdout.write("!");
        console.error(`\n  ✗ Failed to update product ${product.id}: ${err.message}`);
      }
    }

    if (!data.hasNextPage) break;
    page++;
  }

  console.log(`\n\n✓ Re-synced ${total} products`);
}

// ── Main ─────────────────────────────────────────────────────────────────────

const [,, cmd, ...args] = process.argv;

if (!cmd) {
  console.log(`
Usage:
  node scripts/fix-categories.mjs --list
      Show all categories, their products, and subcategories.

  node scripts/fix-categories.mjs --rename <old-slug> "<Arabic Name>" [<new-slug>]
      Rename (and optionally re-slug) a category.
      If the slug changes, all its products are re-saved so categorySlug stays in sync.

  node scripts/fix-categories.mjs --resync-slugs
      Re-save every product to refresh the denormalized categorySlug/subcategorySlug fields.

Env vars:
  CMS_URL=https://your-cms.railway.app  CMS_EMAIL=admin@...  CMS_PASSWORD=...
`);
  process.exit(0);
}

await login();

switch (cmd) {
  case "--list":
    await cmdList();
    break;

  case "--rename": {
    const [oldSlug, newNameAr, newSlug] = args;
    if (!oldSlug || !newNameAr) {
      console.error("Usage: --rename <old-slug> \"<New Arabic Name>\" [<new-slug>]");
      process.exit(1);
    }
    await cmdRename(oldSlug, newNameAr, newSlug);
    break;
  }

  case "--resync-slugs":
    await cmdResyncAll();
    break;

  default:
    console.error(`Unknown command: ${cmd}`);
    process.exit(1);
}
