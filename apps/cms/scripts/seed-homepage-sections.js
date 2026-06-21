/**
 * Append a fixed list of skeleton homepage sections (05-21 from the
 * screenshot the editor lost mid-save) to the existing Home Page global.
 *
 * Block content is left as empty/placeholder; you open each one in admin
 * after running this and fill in the actual products/title/etc.
 *
 * Idempotent in spirit but not literally — every run appends another set
 * of 17 blocks. Only run when you've actually lost work and need the
 * skeleton back. Verify via /admin/globals/home-page after.
 *
 * Usage:
 *   node scripts/seed-homepage-sections.js                       (prod)
 *   node scripts/seed-homepage-sections.js --cms http://localhost:3001
 */

const args = require("node:util").parseArgs({
  options: {
    cms:      { type: "string",  default: "https://cms.digital-plus3.com" },
    email:    { type: "string",  default: "abdalhmeed.dradkeh@gmail.com" },
    password: { type: "string",  default: "@Bd.dradkeh1" },
    "dry-run":{ type: "boolean", default: false },
  },
  strict: false,
}).values;

const CMS = String(args.cms).replace(/\/$/, "");
const DRY = Boolean(args["dry-run"]);

// The 17 blocks lost in the failed save — same order as the screenshot.
// Each block has the bare minimum required fields filled with a stub so
// Payload's validation passes; everything else is left for the editor.
const TO_APPEND = [
  { blockType: "featuredProducts",  title: "منتجات مميزة 05", products: [], enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 06", products: [], enabled: true },
  { blockType: "multiImageBanner",  slides: [],                 aspectRatio: "16/6", autoplay: true, enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 08", products: [], enabled: true },
  { blockType: "multiImageBanner",  slides: [],                 aspectRatio: "16/6", autoplay: true, enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 10", products: [], enabled: true },
  { blockType: "multiImageBanner",  slides: [],                 aspectRatio: "16/6", autoplay: true, enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 12", products: [], enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 13", products: [], enabled: true },
  { blockType: "multiImageBanner",  slides: [],                 aspectRatio: "16/6", autoplay: true, enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 15", products: [], enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 16", products: [], enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 17", products: [], enabled: true },
  { blockType: "featuredProducts",  title: "منتجات مميزة 18", products: [], enabled: true },
  { blockType: "testimonials",      title: "آراء العملاء",     items: [],   enabled: true },
  { blockType: "featureBlocks",     title: "مميزات المتجر",    items: [],   enabled: true },
  { blockType: "faqSection",        title: "الأسئلة الشائعة",  items: [],   enabled: true },
];

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

async function readHomePage(token) {
  const res = await fetch(`${CMS}/api/globals/home-page?depth=0`, {
    headers: { Authorization: `JWT ${token}` },
  });
  if (!res.ok) throw new Error(`GET home-page failed: ${res.status}`);
  return res.json();
}

async function writeHomePage(token, data) {
  const res = await fetch(`${CMS}/api/globals/home-page`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`POST home-page failed: ${res.status} ${text}`);
  return JSON.parse(text);
}

async function main() {
  console.log(`🔐 Logging in to ${CMS}…`);
  const token = await login();
  console.log("✓ Logged in.");

  console.log("📥 Reading current home-page sections…");
  const current = await readHomePage(token);
  const existing = Array.isArray(current?.sections) ? current.sections : [];
  console.log(`   Existing sections: ${existing.length}`);
  for (const [i, s] of existing.entries()) {
    console.log(`   [${String(i + 1).padStart(2, "0")}] ${s?.blockType}`);
  }

  const next = { ...current, sections: [...existing, ...TO_APPEND] };
  console.log(`\n📝 Will append ${TO_APPEND.length} blocks → total ${next.sections.length}`);
  for (const [i, s] of TO_APPEND.entries()) {
    console.log(`   + [${String(existing.length + i + 1).padStart(2, "0")}] ${s.blockType}${s.title ? ` — ${s.title}` : ""}`);
  }

  if (DRY) {
    console.log("\n(--dry-run set, not writing) ✓");
    return;
  }

  console.log("\n💾 Saving…");
  await writeHomePage(token, next);
  console.log("✓ Done. Open /admin/globals/home-page to fill in product lists, slide images, etc.");
}

main().catch((e) => { console.error(e); process.exit(1); });
