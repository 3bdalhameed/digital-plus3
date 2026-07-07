import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { verifyGuestToken } from "@/lib/otp";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma as prismaOrders } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(
    z.object({
      productId: z.union([z.string(), z.number()]).transform((v) => Number(v)),
      name: z.string(),
      quantity: z.coerce.number().min(1),
      unitPrice: z.coerce.number().min(0),
    })
  ),
  totalAmount: z.coerce.number().min(0),
  currency: z.string().default("USD"),
  // Guests skip NextAuth entirely and pass the short-lived token they
  // got from /api/auth/otp/verify. Server verifies the token here and
  // uses the email claim as the customer identity.
  guestToken: z.string().optional(),
  guestName: z.string().max(120).optional(),
});

async function getOrCreateCustomer(
  email: string,
  name: string
): Promise<number> {
  const rows = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM customers WHERE email = ${email} LIMIT 1`
  );
  if (rows[0]?.id) {
    console.log("[test-pay] found customer id:", rows[0].id);
    return rows[0].id;
  }

  const created = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      INSERT INTO customers (email, name, updated_at, created_at)
      VALUES (${email}, ${name || email}, NOW(), NOW())
      RETURNING id
    `
  );
  console.log("[test-pay] created customer id:", created[0].id);
  return created[0].id;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      console.error("test-pay validation:", JSON.stringify(parsed.error.flatten()));
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { items, totalAmount, currency, guestToken, guestName } = parsed.data;

    // Two accepted identities: a real NextAuth session (registered user)
    // OR a guest token freshly minted by /api/auth/otp/verify. Either one
    // yields an email we can use to find / create a customer row.
    let customerEmail: string;
    let customerName:  string;
    const session = await auth();
    if (session?.user?.email) {
      customerEmail = session.user.email;
      customerName  = session.user.name || session.user.email;
    } else if (guestToken) {
      const email = await verifyGuestToken(guestToken);
      if (!email) {
        return NextResponse.json({ error: "رمز الضيف غير صالح أو منتهي" }, { status: 401 });
      }
      customerEmail = email;
      customerName  = guestName?.trim() || email;
    } else {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    // Verify all products exist in Neon before creating the order
    const productIds = items.map((i) => i.productId);
    const existingProducts = await prismaOrders.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)})`
    );
    if (existingProducts.length !== productIds.length) {
      const foundIds = new Set(existingProducts.map((p) => p.id));
      const missing = productIds.filter((id) => !foundIds.has(id));
      console.error("[test-pay] products not found:", missing);
      return NextResponse.json(
        { error: "بعض المنتجات غير موجودة" },
        { status: 400 }
      );
    }

    const customerId = await getOrCreateCustomer(customerEmail, customerName);

    // Draw from the same Postgres sequence Payload's onCreate hook uses so
    // both flows produce consistent Order-XXXXX numbers. Falls back to a
    // timestamp form if the sequence isn't there yet on this DB.
    let orderNumber: string;
    try {
      const seqRes = await prismaOrders.$queryRaw<{ n: number }[]>(
        Prisma.sql`SELECT nextval('order_number_seq') AS n`
      );
      orderNumber = `Order-${String(seqRes[0].n).padStart(5, "0")}`;
    } catch {
      orderNumber = `Order-${String(Date.now()).slice(-8)}`;
    }
    const ip = extractIP(req);
    const ua = extractUserAgent(req);
    const now = new Date();

    // Insert order row directly into Neon
    const [order] = await prismaOrders.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO orders (
          order_number, status, total_amount, currency,
          terms_accepted_at, terms_accepted_i_p, terms_accepted_user_agent,
          updated_at, created_at
        )
        VALUES (
          ${orderNumber},
          'pending'::"enum_orders_status",
          ${totalAmount},
          ${currency}::"enum_orders_currency",
          ${now.toISOString()}::timestamptz,
          ${ip},
          ${ua},
          ${now.toISOString()}::timestamptz,
          ${now.toISOString()}::timestamptz
        )
        RETURNING id
      `
    );
    const orderId = order.id;

    // Insert each item and its product relationship
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = crypto.randomBytes(12).toString("hex");
      const totalPrice = item.unitPrice * item.quantity;

      await prismaOrders.$executeRaw(
        Prisma.sql`
          INSERT INTO orders_items (_order, _parent_id, id, quantity, unit_price, total_price)
          VALUES (${i + 1}, ${orderId}, ${itemId}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
        `
      );

      await prismaOrders.$executeRaw(
        Prisma.sql`
          INSERT INTO orders_rels (parent_id, path, products_id)
          VALUES (${orderId}, ${`items.${i}.product`}, ${item.productId})
        `
      );
    }

    // Link customer to this order
    await prismaOrders.$executeRaw(
      Prisma.sql`
        INSERT INTO orders_rels (parent_id, path, customers_id)
        VALUES (${orderId}, 'customer', ${customerId})
      `
    );

    // Back-link order from customer's orders list
    await prismaOrders.$executeRaw(
      Prisma.sql`
        INSERT INTO customers_rels (parent_id, path, orders_id)
        VALUES (${customerId}, 'orders', ${orderId})
      `
    );

    // Mark abandoned cart as completed
    await prismaOrders.$executeRaw(
      Prisma.sql`
        UPDATE abandoned_carts
        SET completed_at = ${now.toISOString()}::timestamptz, updated_at = ${now.toISOString()}::timestamptz
        WHERE user_email = ${customerEmail} AND completed_at IS NULL
      `
    );

    console.log(`[test-pay] Order ${orderNumber} (id=${orderId}) created for customer ${customerId}`);

    return NextResponse.json({ orderId: String(orderId), orderNumber });
  } catch (error: any) {
    console.error("Test pay error:", error);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
