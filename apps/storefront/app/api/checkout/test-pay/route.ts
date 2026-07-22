import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveIdentity,
  mintOrderNumber,
  findMissingProductIds,
  createOrderForCustomer,
  extractIP,
  extractUserAgent,
} from "@/lib/checkout-helpers";

/**
 * POST /api/checkout/test-pay
 *
 * Development/testing flow that skips the payment gateway and
 * creates the order directly. Accepts either a NextAuth session
 * or a guest OTP token as identity.
 *
 * 401 response body carries a machine-readable `code` field
 * ("invalid_guest" | "anonymous") the client branches on to route
 * the user back to the OTP re-verify block or the sign-in prompt.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.union([z.string(), z.number()]).transform((v) => Number(v)),
      name:      z.string(),
      quantity:  z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0),
      // Per-item delivery info collected at the cart (per-unit
      // delivery fields keyed by field id, plus an optional
      // activationEmail). Persisted to the order item's delivery_info.
      deliveryInfo: z.record(z.any()).optional(),
    })
  ).min(1),
  totalAmount:    z.coerce.number().min(0),
  currency:       z.string().default("USD"),
  guestToken:     z.string().optional(),
  guestName:      z.string().max(120).optional(),
  discountCode:   z.string().max(64).optional(),
  discountAmount: z.coerce.number().min(0).optional(),
  contactEmail:   z.string().email().max(160).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("[test-pay] validation:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }
    const { items, currency, guestToken, guestName, discountCode, contactEmail } = parsed.data;
    // Server recomputes the subtotal from the line items -- the client's
    // totalAmount is ignored so a tampered `discountAmount: 999999`
    // request can't undercharge.
    const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const identityResult = await resolveIdentity({ guestToken, guestName });
    if (identityResult.kind === "invalid_guest") {
      return NextResponse.json(
        { error: "رمز الضيف غير صالح أو منتهي", code: "invalid_guest" },
        { status: 401 }
      );
    }
    if (identityResult.kind === "anonymous") {
      return NextResponse.json(
        { error: "غير مصرح", code: "anonymous" },
        { status: 401 }
      );
    }
    const identity = identityResult.identity;

    const missing = await findMissingProductIds(items.map((i) => i.productId));
    if (missing.length > 0) {
      console.error("[test-pay] products not found:", missing);
      return NextResponse.json({ error: "بعض المنتجات غير موجودة" }, { status: 400 });
    }

    const orderNumber = await mintOrderNumber();

    const { orderId, customerId } = await createOrderForCustomer({
      orderNumber,
      subtotalAmount: subtotal,
      currency,
      ip:            extractIP(req),
      userAgent:     extractUserAgent(req),
      customerEmail: identity.customerEmail,
      customerName:  identity.customerName,
      discountCode,
      contactEmail,
      items: items.map((i) => ({
        productId: i.productId,
        quantity:  i.quantity,
        unitPrice: i.unitPrice,
        deliveryInfo: i.deliveryInfo && Object.keys(i.deliveryInfo).length > 0 ? i.deliveryInfo : null,
      })),
    });

    console.log(`[test-pay] ${orderNumber} (id=${orderId}) created for customer ${customerId}`);
    return NextResponse.json({ orderId: String(orderId), orderNumber });
  } catch (error: any) {
    console.error("[test-pay] failed:", error?.message, error?.stack, error?.code, error?.meta);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
