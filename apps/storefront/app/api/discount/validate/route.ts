import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/discount/validate
 *
 * Runs all discount-code rules server-side so we can trust the returned
 * `amount` when the client applies it. Never returns the internal usage
 * counter or admin-only fields.
 *
 * Request:
 *   { code, subtotal, currency, items: [{productId, categoryId, quantity, price}], customerEmail? }
 *
 * Response (200):
 *   { valid: true,  code, discountType, discountValue, amount, message }
 *   { valid: false, message }
 *
 * The actual counter increment happens on order creation (server side),
 * not here -- this route is purely a rule check.
 */

const PAYLOAD_API_URL =
  process.env.PAYLOAD_API_URL || "http://localhost:3001/api";

interface ValidateBody {
  code?: string;
  subtotal?: number;
  currency?: string;
  items?: Array<{
    productId: string | number;
    categoryId?: string | number;
    quantity: number;
    price: number;
  }>;
  customerEmail?: string;
}

interface DiscountDoc {
  id: number;
  code: string;
  discountType: "percentage" | "fixed_amount";
  discountValue: number;
  active: boolean;
  startsAt?: string | null;
  expiresAt?: string | null;
  minOrderAmount?: number | null;
  maxUses?: number | null;
  currentUses: number;
  maxUsesPerCustomer?: number | null;
  appliesTo: "all" | "categories" | "products";
  allowedCategories?: Array<{ id: number | string } | number | string>;
  allowedProducts?: Array<{ id: number | string } | number | string>;
}

function fail(message: string, status = 200) {
  return NextResponse.json({ valid: false, message }, { status });
}

function idsFromRel(rel: DiscountDoc["allowedCategories"]): Set<string> {
  const out = new Set<string>();
  if (!rel) return out;
  for (const item of rel) {
    if (typeof item === "object" && item !== null && "id" in item) {
      out.add(String((item as any).id));
    } else if (item != null) {
      out.add(String(item));
    }
  }
  return out;
}

export async function POST(req: NextRequest) {
  let body: ValidateBody;
  try {
    body = await req.json();
  } catch {
    return fail("طلب غير صالح");
  }

  const rawCode = (body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!rawCode) return fail("يرجى إدخال كود الخصم");
  if (!Number.isFinite(subtotal) || subtotal <= 0) return fail("السلة فارغة");

  // Look up by exact code, case-insensitive via the upper() index.
  const url = new URL(`${PAYLOAD_API_URL}/discount-codes`);
  url.searchParams.set("where[code][equals]", rawCode);
  url.searchParams.set("depth", "0");
  url.searchParams.set("limit", "1");

  let doc: DiscountDoc | undefined;
  try {
    const res = await fetch(url.toString(), {
      // Discount rules can flip active/expiry any minute -- never cache.
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`cms ${res.status}`);
    const json = (await res.json()) as { docs?: DiscountDoc[] };
    doc = json.docs?.[0];
  } catch {
    return fail("تعذّر التحقق من الكود، حاول مرة أخرى");
  }

  if (!doc) return fail("كود الخصم غير صحيح");
  if (!doc.active) return fail("كود الخصم غير مفعّل");

  const now = Date.now();
  if (doc.startsAt && new Date(doc.startsAt).getTime() > now) {
    return fail("كود الخصم لم يبدأ بعد");
  }
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < now) {
    return fail("انتهت صلاحية كود الخصم");
  }
  if (
    typeof doc.maxUses === "number" &&
    doc.maxUses > 0 &&
    doc.currentUses >= doc.maxUses
  ) {
    return fail("انتهت استخدامات كود الخصم");
  }
  if (
    typeof doc.minOrderAmount === "number" &&
    doc.minOrderAmount > 0 &&
    subtotal < doc.minOrderAmount
  ) {
    return fail(
      `أقل مبلغ لاستخدام هذا الكود هو ${doc.minOrderAmount}`
    );
  }

  // Per-customer usage cap. Only enforced when we know who's asking.
  if (
    typeof doc.maxUsesPerCustomer === "number" &&
    doc.maxUsesPerCustomer > 0 &&
    body.customerEmail
  ) {
    try {
      const orderUrl = new URL(`${PAYLOAD_API_URL}/orders`);
      orderUrl.searchParams.set("where[discountCode][equals]", rawCode);
      orderUrl.searchParams.set(
        "where[customerEmail][equals]",
        body.customerEmail.toLowerCase()
      );
      orderUrl.searchParams.set("depth", "0");
      orderUrl.searchParams.set("limit", "0"); // just want the count
      const res = await fetch(orderUrl.toString(), {
        cache: "no-store",
        headers: {
          Accept: "application/json",
          "x-internal-secret": process.env.PAYLOAD_INTERNAL_SECRET || "",
        },
      });
      if (res.ok) {
        const json = (await res.json()) as { totalDocs?: number };
        const used = json.totalDocs ?? 0;
        if (used >= doc.maxUsesPerCustomer) {
          return fail("لقد استخدمت هذا الكود من قبل");
        }
      }
    } catch {
      // If we can't reach the orders API don't outright block --
      // per-customer check is best-effort; the total maxUses cap already
      // covers global overuse.
    }
  }

  // Figure out which items are eligible for the discount, then compute
  // the amount against JUST the eligible subtotal.
  const eligibleSubtotal = (() => {
    if (doc.appliesTo === "all") return subtotal;

    const allowedCats = idsFromRel(doc.allowedCategories);
    const allowedProds = idsFromRel(doc.allowedProducts);

    let sum = 0;
    for (const it of items) {
      const match =
        doc.appliesTo === "categories"
          ? it.categoryId != null && allowedCats.has(String(it.categoryId))
          : allowedProds.has(String(it.productId));
      if (match) sum += Number(it.price) * Number(it.quantity);
    }
    return sum;
  })();

  if (eligibleSubtotal <= 0) {
    return fail("هذا الكود لا ينطبق على المنتجات في السلة");
  }

  const rawAmount =
    doc.discountType === "percentage"
      ? (eligibleSubtotal * Number(doc.discountValue)) / 100
      : Number(doc.discountValue);

  // Never discount more than the eligible subtotal (fixed-amount codes on
  // small carts) and never send fractional cents back to the client.
  const amount = Math.min(
    Math.max(0, Math.round(rawAmount * 100) / 100),
    eligibleSubtotal
  );

  return NextResponse.json({
    valid: true,
    code: doc.code,
    discountType: doc.discountType,
    discountValue: doc.discountValue,
    amount,
    message: "تم تطبيق كود الخصم",
  });
}
