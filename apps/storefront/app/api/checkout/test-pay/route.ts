import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
  customerId: z.string(),
  items: z.array(
    z.object({
      productId: z.union([z.string(), z.number()]).transform(String),
      name: z.string(),
      quantity: z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0),
    })
  ),
  totalAmount: z.coerce.number().min(0),
  currency: z.string().default("USD"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("test-pay validation errors:", JSON.stringify(parsed.error.flatten(), null, 2));
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { customerId, items, totalAmount, currency } = parsed.data;

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
      termsAcceptedIP: extractIP(req),
      termsAcceptedUserAgent: extractUserAgent(req),
    });

    return NextResponse.json({ orderId: order.id, orderNumber: (order as any).orderNumber });
  } catch (error: any) {
    console.error("Test pay error:", error);
    return NextResponse.json({ error: error.message || "فشل إنشاء الطلب" }, { status: 500 });
  }
}
