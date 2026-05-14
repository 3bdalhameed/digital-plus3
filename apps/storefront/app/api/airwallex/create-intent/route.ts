import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createPaymentIntent } from "@/lib/airwallex";
import { createOrder } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { createEvidenceLog } from "@/lib/payload";
import { z } from "zod";

export const dynamic = "force-dynamic";

const intentSchema = z.object({
  customerId: z.string(),
  items: z.array(
    z.object({
      productId: z.string(),
      name: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number().min(0),
    })
  ),
  totalAmount: z.number().min(0),
  currency: z.string().default("USD"),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = intentSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { customerId, items, totalAmount, currency, sessionId } = parsed.data;
    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);

    // 1. Create order in Payload CMS
    const order = await createOrder({
      customer: customerId,
      items: items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.unitPrice * item.quantity,
      })),
      totalAmount,
      currency,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedIP: ipAddress,
      termsAcceptedUserAgent: userAgent,
    });

    // 2. Create Airwallex payment intent
    const intent = await createPaymentIntent({
      amount: totalAmount,
      currency,
      merchant_order_id: order.orderNumber || order.id,
      metadata: {
        orderId: order.id,
        customerId,
      },
      order: {
        products: items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          unit_price: item.unitPrice,
        })),
      },
    });

    // 3. Log payment initiation as evidence
    await createEvidenceLog({
      type: "payment",
      order: order.id,
      customer: customerId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      sessionId,
      data: {
        airwallexIntentId: intent.id,
        amount: totalAmount,
        currency,
        status: "initiated",
      },
    });

    return NextResponse.json({
      intentId: intent.id,
      clientSecret: intent.client_secret,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (error: any) {
    console.error("Create intent error:", error);
    return NextResponse.json(
      { error: error.message || "فشل إنشاء طلب الدفع" },
      { status: 500 }
    );
  }
}
