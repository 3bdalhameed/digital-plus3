import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import {
  resolveIdentity,
  getOrCreateCustomer,
  mintOrderNumber,
  findMissingProductIds,
  writeOrder,
  linkOrderToCustomer,
  extractIP,
  extractUserAgent,
} from "@/lib/checkout-helpers";

/**
 * POST /api/checkout/test-pay
 *
 * Development/testing flow that skips the payment gateway and
 * creates the order directly. Accepts either a NextAuth session
 * or a guest OTP token as identity.
 */
export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.union([z.string(), z.number()]).transform((v) => Number(v)),
      name:      z.string(),
      quantity:  z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0),
    })
  ).min(1),
  totalAmount: z.coerce.number().min(0),
  currency:    z.string().default("USD"),
  guestToken:  z.string().optional(),
  guestName:   z.string().max(120).optional(),
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
    const { items, totalAmount, currency, guestToken, guestName } = parsed.data;

    const identity = await resolveIdentity({ guestToken, guestName });
    if (!identity) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const missing = await findMissingProductIds(items.map((i) => i.productId));
    if (missing.length > 0) {
      console.error("[test-pay] products not found:", missing);
      return NextResponse.json({ error: "بعض المنتجات غير موجودة" }, { status: 400 });
    }

    const customerId  = await getOrCreateCustomer(identity.customerEmail, identity.customerName);
    const orderNumber = await mintOrderNumber();

    const orderId = await writeOrder({
      orderNumber,
      totalAmount,
      currency,
      ip:        extractIP(req),
      userAgent: extractUserAgent(req),
      items:     items.map((i) => ({
        productId: i.productId,
        quantity:  i.quantity,
        unitPrice: i.unitPrice,
      })),
    });

    await linkOrderToCustomer({
      orderId,
      customerId,
      customerEmail: identity.customerEmail,
    });

    console.log(`[test-pay] ${orderNumber} (id=${orderId}) created for customer ${customerId}`);
    return NextResponse.json({ orderId: String(orderId), orderNumber });
  } catch (error: any) {
    console.error("[test-pay] failed:", error?.message);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
