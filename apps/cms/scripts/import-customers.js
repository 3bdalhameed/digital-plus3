/**
 * Import customers from Shopify CSV export into Payload CMS.
 * Usage: node scripts/import-customers.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH    = path.resolve(__dirname, "customers_export.csv");
const PAYLOAD_URL = "http://localhost:3001";
const ADMIN_EMAIL = "abdalhmeed.dradkeh@gmail.com";
const ADMIN_PASS  = "@Bd.dradkeh1";

async function login() {
  const res = await fetch(`${PAYLOAD_URL}/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const { token } = await res.json();
  if (!token) throw new Error("Login failed");
  return token;
}

async function customerExists(token, email) {
  const res = await fetch(
    `${PAYLOAD_URL}/api/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: `JWT ${token}` } }
  );
  const data = await res.json();
  return data.docs?.[0] || null;
}

async function createCustomer(token, data) {
  const res = await fetch(`${PAYLOAD_URL}/api/customers`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
    body: JSON.stringify(data),
  });
  return res.ok;
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
  console.log(`👥 ${rows.length} customers found in CSV\n`);

  let created = 0, skipped = 0, failed = 0;

  for (const row of rows) {
    const email = row["Email"] || row["email"];
    if (!email) { skipped++; continue; }

    const firstName = row["First Name"] || row["first_name"] || "";
    const lastName  = row["Last Name"]  || row["last_name"]  || "";
    const phone     = row["Phone"]      || row["phone"]      || "";
    const name      = `${firstName} ${lastName}`.trim() || email.split("@")[0];

    process.stdout.write(`→ ${email} … `);

    const existing = await customerExists(token, email);
    if (existing) { console.log("already exists"); skipped++; continue; }

    const ok = await createCustomer(token, {
      name,
      email,
      phone: phone || undefined,
      status: "active",
    });

    if (ok) { console.log("✓ created"); created++; }
    else     { console.log("✗ failed");  failed++;  }

    await new Promise(r => setTimeout(r, 200));
  }

  console.log(`\n✅ Done — ${created} created, ${skipped} skipped, ${failed} failed`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
