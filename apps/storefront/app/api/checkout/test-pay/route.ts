import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";
import crypto from "crypto";

export const dynamic = "force-dynamic";

// Direct connection to the Neon DB (same DB the storefront reads products from)
const globalForPrisma = global as unknown as { __ordersPrisma: PrismaClient };
const prismaOrders =
  globalForPrisma.__ordersPrisma ||
  new PrismaClient({
    datasources: {
      db: { url: process.env.CMS_DATABASE_URL || process.env.DATABASE_URL },
    },
  });
if (process.env.NODE_ENV !== "production")
  globalForPrisma.__ordersPrisma = prismaOrders;

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

    const customerId = await getOrCreateCustomer(
      session.user.email,
      session.user.name || session.user.email
    );

    const orderNumber = `ORD-${Date.now()}-${Math.random()
      .toString(36)
      .substr(2, 4)
      .toUpperCase()}`;
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
        WHERE user_email = ${session.user.email} AND completed_at IS NULL
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
