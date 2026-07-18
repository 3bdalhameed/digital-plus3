import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/cart/stock
 *
 * Returns the current `inStock` state (true/false) for a list of
 * product IDs the cart is holding. The cart stores a snapshot of the
 * product at add-time -- if the admin marks a product out of stock
 * after the visitor already added it, the client wouldn't know
 * without asking. This endpoint gives the cart a way to check.
 *
 * Request:  { ids: (string | number)[] }
 * Response: { stock: { [id: string]: boolean } }
 *
 * Never fails hard: if the CMS is unreachable we return an empty map
 * and the cart falls back to whatever it had cached (avoids blocking
 * checkout on a transient CMS blip).
 */

const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api";

export async function POST(req: NextRequest) {
  let body: { ids?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ stock: {} });
  }

  const ids = Array.isArray(body.ids)
    ? body.ids.map(String).filter((s) => s.trim())
    : [];
  if (ids.length === 0) return NextResponse.json({ stock: {} });

  try {
    const url = new URL(`${PAYLOAD_API_URL}/products`);
    // Payload `where[id][in]` accepts a comma-separated list.
    url.searchParams.set("where[id][in]", ids.join(","));
    url.searchParams.set("depth", "0");
    url.searchParams.set("limit", String(ids.length));

    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return NextResponse.json({ stock: {} });

    const json = (await res.json()) as { docs?: { id: string | number; inStock?: boolean }[] };
    const stock: Record<string, boolean> = {};
    for (const doc of json.docs ?? []) {
      // Default to true (in-stock) when the field is missing -- the
      // CMS column has default TRUE and only flips to false when an
      // editor explicitly deselects it.
      stock[String(doc.id)] = doc.inStock !== false;
    }
    return NextResponse.json({ stock });
  } catch {
    return NextResponse.json({ stock: {} });
  }
}
