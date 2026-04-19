/**
 * Import orders from Shopify CSV export into Payload CMS.
 * Usage: node scripts/import-orders.js
 */

const fs = require("fs");
const path = require("path");
const { parse } = require("csv-parse/sync");

const CSV_PATH    = path.resolve(__dirname, "orders_export.csv");
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

async function safeJson(res) {
  const text = await res.text();
  try { return JSON.parse(text); } catch { return null; }
}

async function getCustomerByEmail(token, email, cache) {
  if (!email) return null;
  if (cache[email] !== undefined) return cache[email];
  const res = await fetch(
    `${PAYLOAD_URL}/api/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
    { headers: { Authorization: `JWT ${token}` } }
  );
  const data = await safeJson(res);
  cache[email] = data?.docs?.[0]?.id || null;
  return cache[email];
}

async function getProductByName(token, name, cache) {
  if (!name) return null;
  if (cache[name] !== undefined) return cache[name];
  const res = await fetch(
    `${PAYLOAD_URL}/api/products?where[nameAr][equals]=${encodeURIComponent(name)}&limit=1`,
    { headers: { Authorization: `JWT ${token}` } }
  );
  const data = await safeJson(res);
  cache[name] = data?.docs?.[0]?.id || null;
  return cache[name];
}

function mapStatus(financial, fulfillment) {
  if (financial === "refunded") return "refunded";
  if (financial === "paid" && fulfillment === "fulfilled") return "delivered";
  if (financial === "paid") return "paid";
  if (financial === "pending") return "pending";
  return "pending";
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

  // Group rows by order name (Shopify repeats order rows per line item)
  const orderMap = {};
  for (const row of rows) {
    const name = row["Name"] || row["Order Number"] || row["name"];
    if (!name) continue;
    if (!orderMap[name]) orderMap[name] = [];
    orderMap[name].push(row);
  }

  const orders = Object.entries(orderMap);
  console.log(`📦 ${orders.length} unique orders found\n`);

  const customerCache = {}, productCache = {};
  let created = 0, failed = 0;

  for (const [orderNumber, lineRows] of orders) {
    const first = lineRows[0];
    const email = first["Email"] || first["email"] || "";
    const financial   = (first["Financial Status"]   || "").toLowerCase();
    const fulfillment = (first["Fulfillment Status"] || "").toLowerCase();
    const total  = parseFloat(first["Total"] || first["total"] || "0") || 0;
    const currency = first["Currency"] || "USD";

    process.stdout.write(`→ ${orderNumber} … `);

    const customerId = await getCustomerByEmail(token, email, customerCache);

    // Build line items
    const items = [];
    for (const row of lineRows) {
      const productName = row["Lineitem name"] || row["lineitem_name"] || "";
      const qty   = parseInt(row["Lineitem quantity"] || "1") || 1;
      const price = parseFloat(row["Lineitem price"] || "0") || 0;
      const productId = await getProductByName(token, productName, productCache);
      items.push({ product: productId || undefined, productName, quantity: qty, unitPrice: price, totalPrice: price * qty });
    }

    const payload = {
      orderNumber,
      status: mapStatus(financial, fulfillment),
      totalAmount: total,
      currency,
      customer: customerId || undefined,
      items,
      notes: `Imported from Shopify`,
    };

    const res = await fetch(`${PAYLOAD_URL}/api/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `JWT ${token}` },
      body: JSON.stringify(payload),
    });

    if (res.ok) { console.log("✓"); created++; }
    else {
      const body = await res.text();
      console.log(`✗ (${res.status}): ${body.slice(0, 120)}`);
      failed++;
    }

    await new Promise(r => setTimeout(r, 250));
  }

  console.log(`\n✅ Done — ${created} imported, ${failed} failed`);
}

main().catch(err => { console.error("Fatal:", err); process.exit(1); });
