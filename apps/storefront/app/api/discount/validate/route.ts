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
  /** Which language to return messages in. Client passes this from the
   *  locale store. Defaults to "ar" so a request without lang still
   *  returns Arabic (the pre-i18n behavior). */
  lang?: "ar" | "en";
}

/**
 * Every user-facing message the validate route can return, in both
 * supported languages. Keys are the concept, values pick per lang.
 * Messages that need to substitute a value (min-order amount) are
 * functions.
 */
const MSG = {
  invalidRequest:  { ar: "طلب غير صالح",                              en: "Invalid request" },
  emptyCode:       { ar: "يرجى إدخال كود الخصم",                     en: "Please enter a discount code" },
  emptyCart:       { ar: "السلة فارغة",                                en: "Cart is empty" },
  lookupFailed:    { ar: "تعذّر التحقق من الكود، حاول مرة أخرى",     en: "Couldn't verify the code, please try again" },
  notFound:        { ar: "كود الخصم غير صحيح",                        en: "Invalid discount code" },
  inactive:        { ar: "كود الخصم غير مفعّل",                       en: "This discount code is not active" },
  notStarted:      { ar: "كود الخصم لم يبدأ بعد",                     en: "This discount code hasn't started yet" },
  expired:         { ar: "انتهت صلاحية كود الخصم",                    en: "This discount code has expired" },
  usedUp:          { ar: "انتهت استخدامات كود الخصم",                 en: "This discount code has been used up" },
  minOrder:        (v: number) => ({
    ar: `أقل مبلغ لاستخدام هذا الكود هو ${v}`,
    en: `Minimum order to use this code is ${v}`,
  }),
  alreadyUsed:     { ar: "لقد استخدمت هذا الكود من قبل",              en: "You've already used this code" },
  notEligible:     { ar: "هذا الكود لا ينطبق على المنتجات في السلة",  en: "This code doesn't apply to any items in your cart" },
  applied:         { ar: "تم تطبيق كود الخصم",                        en: "Discount code applied" },
} as const;

type LangCode = "ar" | "en";
function pickLang(l: unknown): LangCode {
  return l === "en" ? "en" : "ar";
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
  // Parse body first; if it's junk we still need to pick a lang so
  // the error message reads in the caller's script.
  let body: ValidateBody;
  try {
    body = await req.json();
  } catch {
    return fail(MSG.invalidRequest.ar);
  }
  const lang = pickLang(body.lang);

  const rawCode = (body.code ?? "").trim().toUpperCase();
  const subtotal = Number(body.subtotal ?? 0);
  const items = Array.isArray(body.items) ? body.items : [];

  if (!rawCode) return fail(MSG.emptyCode[lang]);
  if (!Number.isFinite(subtotal) || subtotal <= 0) return fail(MSG.emptyCart[lang]);

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
    return fail(MSG.lookupFailed[lang]);
  }

  if (!doc) return fail(MSG.notFound[lang]);
  if (!doc.active) return fail(MSG.inactive[lang]);

  const now = Date.now();
  if (doc.startsAt && new Date(doc.startsAt).getTime() > now) {
    return fail(MSG.notStarted[lang]);
  }
  if (doc.expiresAt && new Date(doc.expiresAt).getTime() < now) {
    return fail(MSG.expired[lang]);
  }
  if (
    typeof doc.maxUses === "number" &&
    doc.maxUses > 0 &&
    doc.currentUses >= doc.maxUses
  ) {
    return fail(MSG.usedUp[lang]);
  }
  if (
    typeof doc.minOrderAmount === "number" &&
    doc.minOrderAmount > 0 &&
    subtotal < doc.minOrderAmount
  ) {
    return fail(MSG.minOrder(doc.minOrderAmount)[lang]);
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
          return fail(MSG.alreadyUsed[lang]);
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
    return fail(MSG.notEligible[lang]);
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
    message: MSG.applied[lang],
  });
}
