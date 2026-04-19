import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";

const orderSchema = z.object({
  items: z.array(
    z.object({
      productId: z.string(),
      quantity: z.number().min(1),
      unitPrice: z.number(),
      totalPrice: z.number(),
    })
  ),
  totalAmount: z.number(),
  currency: z.string().default("USD"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = orderSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);

    const order = await createOrder({
      customer: session.user.id,
      items: parsed.data.items.map((item) => ({
        product: item.productId,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        totalPrice: item.totalPrice,
      })),
      totalAmount: parsed.data.totalAmount,
      currency: parsed.data.currency,
      termsAcceptedAt: new Date().toISOString(),
      termsAcceptedIP: ipAddress,
      termsAcceptedUserAgent: userAgent,
    });

    return NextResponse.json(order, { status: 201 });
  } catch (error: any) {
    console.error("Create order error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب" },
      { status: 500 }
    );
  }
}
