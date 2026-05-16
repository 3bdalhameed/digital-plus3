import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createOrder } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";

export const dynamic = "force-dynamic";

const schema = z.object({
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

async function getOrCreatePayloadCustomer(
  email: string,
  name: string
): Promise<string> {
  const apiUrl = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
  const secret = process.env.PAYLOAD_INTERNAL_SECRET || "";
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    "x-internal-secret": secret,
  };

  const findRes = await fetch(
    `${apiUrl}/customers?where[email][equals]=${encodeURIComponent(email)}&limit=1`,
    { headers, cache: "no-store" }
  );
  if (findRes.ok) {
    const findData = await findRes.json();
    if (findData?.docs?.[0]?.id) return String(findData.docs[0].id);
  }

  const createRes = await fetch(`${apiUrl}/customers`, {
    method: "POST",
    headers,
    body: JSON.stringify({ email, name: name || email }),
  });
  if (!createRes.ok) {
    const err = await createRes.json().catch(() => ({}));
    throw new Error(`Failed to create customer: ${err.message || createRes.statusText}`);
  }
  const createData = await createRes.json();
  return String(createData?.doc?.id);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("test-pay validation:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, totalAmount, currency } = parsed.data;

    const payloadCustomerId = await getOrCreatePayloadCustomer(
      session.user.email,
      session.user.name || session.user.email
    );

    const order = await createOrder({
      customer: payloadCustomerId,
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

    return NextResponse.json({
      orderId: order.id,
      orderNumber: (order as any).orderNumber,
    });
  } catch (error: any) {
    console.error("Test pay error:", error);
    return NextResponse.json(
      { error: error.message || "فشل إنشاء الطلب" },
      { status: 500 }
    );
  }
}
