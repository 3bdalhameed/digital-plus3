import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { verifyGuestToken } from "@/lib/otp";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma as prismaOrders } from "@/lib/prisma";

/**
 * POST /api/checkout/manual-payment
 *
 * Non-gateway checkout for payment methods that need human follow-up:
 *   - Jordan CliQ (bank instant transfer)
 *   - Egypt Vodafone Cash
 *
 * Flow:
 *   1. Validate + auth (email session)
 *   2. Create the order in `pending` status with paymentReference set
 *      to the method slug so support can filter/search on it.
 *   3. Create a SupportTicket linked to the order with channel="whatsapp"
 *      and a formatted admin message so support sees exactly which
 *      payment method the customer picked, the amount, and the contact
 *      number to reach out on.
 *
 * Returns { orderId, orderNumber } like the other checkout endpoints so
 * the checkout page can navigate to /checkout/success on completion.
 */

export const dynamic = "force-dynamic";

const PAYMENT_METHODS = {
  qlic: {
    slug:  "qlic",
    label: "CliQ - الأردن",
    currencyHint: "JOD",
  },
  vodafone_cash: {
    slug:  "vodafone_cash",
    label: "فودافون كاش - مصر",
    currencyHint: "EGP",
  },
} as const;

type MethodKey = keyof typeof PAYMENT_METHODS;

const schema = z.object({
  method: z.enum(["qlic", "vodafone_cash"]),
  contactPhone: z.string().min(6).max(30),
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
  // Guest checkout — same mechanism as test-pay: JWT minted by
  // /api/auth/otp/verify. Optional; the auth block below prefers a
  // NextAuth session when both are present.
  guestToken: z.string().optional(),
  guestName:  z.string().max(120).optional(),
});

async function getOrCreateCustomer(email: string, name: string): Promise<number> {
  const rows = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`SELECT id FROM customers WHERE email = ${email} LIMIT 1`
  );
  if (rows[0]?.id) return rows[0].id;
  const created = await prismaOrders.$queryRaw<{ id: number }[]>(
    Prisma.sql`
      INSERT INTO customers (email, name, updated_at, created_at)
      VALUES (${email}, ${name || email}, NOW(), NOW())
      RETURNING id
    `
  );
  return created[0].id;
}

function buildTicketMessage(opts: {
  method: MethodKey;
  contactPhone: string;
  totalAmount: number;
  currency: string;
  orderNumber: string;
  customerEmail: string;
  customerName: string;
}): string {
  const m = PAYMENT_METHODS[opts.method];
  return [
    `طلب دفع يدوي جديد — ${m.label}`,
    ``,
    `رقم الطلب: ${opts.orderNumber}`,
    `المبلغ: ${opts.totalAmount} ${opts.currency}`,
    ``,
    `اسم العميل: ${opts.customerName}`,
    `البريد الإلكتروني: ${opts.customerEmail}`,
    `رقم التواصل: ${opts.contactPhone}`,
    ``,
    `الرجاء التواصل مع العميل وتزويده بتفاصيل الدفع، ثم تحديث حالة الطلب بعد استلام المبلغ.`,
  ].join("\n");
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { method, contactPhone, items, totalAmount, currency, guestToken, guestName } =
      parsed.data;

    // Session OR guest token; matches the auth block in test-pay.
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

    // Verify products exist (defensive — prevents FK-violation crashes
    // if the cart references a since-deleted product).
    const productIds = items.map((i) => i.productId);
    const existingProducts = await prismaOrders.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM products WHERE id IN (${Prisma.join(productIds)})`
    );
    if (existingProducts.length !== productIds.length) {
      return NextResponse.json({ error: "بعض المنتجات غير موجودة" }, { status: 400 });
    }

    const customerId = await getOrCreateCustomer(customerEmail, customerName);

    // Order number generation: we'd love to use the Postgres sequence
    // but this endpoint writes SQL directly (not via Payload), so
    // sample the sequence explicitly. Falls back to a timestamp form
    // if the sequence isn't there yet on this DB.
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
    const now = new Date().toISOString();
    const paymentRef = `manual:${PAYMENT_METHODS[method].slug}:${contactPhone}`;

    // Create the order (pending). Payment status flips to paid when
    // support marks it in the admin.
    const [order] = await prismaOrders.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO orders (
          order_number, status, total_amount, currency,
          payment_reference,
          terms_accepted_at, terms_accepted_i_p, terms_accepted_user_agent,
          updated_at, created_at
        )
        VALUES (
          ${orderNumber},
          'pending'::"enum_orders_status",
          ${totalAmount},
          ${currency}::"enum_orders_currency",
          ${paymentRef},
          ${now}::timestamptz,
          ${ip},
          ${ua},
          ${now}::timestamptz,
          ${now}::timestamptz
        )
        RETURNING id
      `
    );
    const orderId = order.id;

    // Line items + product refs.
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const itemId = crypto.randomBytes(12).toString("hex");
      const totalPrice = item.unitPrice * item.quantity;

      await prismaOrders.$executeRaw(Prisma.sql`
        INSERT INTO orders_items (_order, _parent_id, id, quantity, unit_price, total_price)
        VALUES (${i + 1}, ${orderId}, ${itemId}, ${item.quantity}, ${item.unitPrice}, ${totalPrice})
      `);
      await prismaOrders.$executeRaw(Prisma.sql`
        INSERT INTO orders_rels (parent_id, path, products_id)
        VALUES (${orderId}, ${`items.${i}.product`}, ${item.productId})
      `);
    }

    // Customer ↔ order links (both directions).
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO orders_rels (parent_id, path, customers_id)
      VALUES (${orderId}, 'customer', ${customerId})
    `);
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO customers_rels (parent_id, path, orders_id)
      VALUES (${customerId}, 'orders', ${orderId})
    `);

    // Auto-close abandoned cart tracking for this customer.
    await prismaOrders.$executeRaw(Prisma.sql`
      UPDATE abandoned_carts
      SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
      WHERE user_email = ${customerEmail} AND completed_at IS NULL
    `);

    // Support ticket so the team sees this in /admin/collections/support-tickets.
    // channel="whatsapp" flags this as needing a phone follow-up. The
    // seeded admin message includes everything support needs to reach
    // out without opening the order.
    const messageText = buildTicketMessage({
      method,
      contactPhone,
      totalAmount,
      currency,
      orderNumber,
      customerEmail,
      customerName,
    });

    const [ticket] = await prismaOrders.$queryRaw<{ id: number }[]>(Prisma.sql`
      INSERT INTO support_tickets (status, channel, updated_at, created_at)
      VALUES ('open'::"enum_support_tickets_status", 'whatsapp'::"enum_support_tickets_channel", ${now}::timestamptz, ${now}::timestamptz)
      RETURNING id
    `);
    const ticketId = ticket.id;

    // Payload arrays -> child table. Seeded message from the "admin"
    // sender so the phrasing reads as a system-generated instruction.
    const messageRowId = crypto.randomBytes(12).toString("hex");
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO support_tickets_messages (_order, _parent_id, id, sender, text, timestamp)
      VALUES (1, ${ticketId}, ${messageRowId}, 'admin'::"enum_support_tickets_messages_sender", ${messageText}, ${now}::timestamptz)
    `);
    // Relationship rows: order + customer.
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO support_tickets_rels (parent_id, path, orders_id)
      VALUES (${ticketId}, 'order', ${orderId})
    `);
    await prismaOrders.$executeRaw(Prisma.sql`
      INSERT INTO support_tickets_rels (parent_id, path, customers_id)
      VALUES (${ticketId}, 'customer', ${customerId})
    `);

    console.log(
      `[manual-payment] ${method} order ${orderNumber} (id=${orderId}) — support ticket ${ticketId} opened`
    );

    return NextResponse.json({
      orderId:     String(orderId),
      orderNumber,
      ticketId:    String(ticketId),
      method,
    });
  } catch (error: any) {
    console.error("[manual-payment] failed:", error?.message);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
