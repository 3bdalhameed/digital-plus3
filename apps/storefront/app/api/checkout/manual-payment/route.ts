import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import crypto from "crypto";
import { prisma as prismaOrders } from "@/lib/prisma";
import {
  resolveIdentity,
  getOrCreateCustomer,
  mintOrderNumber,
  findMissingProductIds,
  createOrderForCustomer,
  extractIP,
  extractUserAgent,
} from "@/lib/checkout-helpers";

/**
 * POST /api/checkout/manual-payment
 *
 * Non-gateway checkout for payment methods that need human follow-up:
 *   - Jordan CliQ (bank instant transfer)
 *   - Egypt Vodafone Cash
 *
 * Creates the order in `pending` status with payment_reference set to
 * the method slug, then opens a SupportTicket with a seeded admin
 * message so support can reach out to the customer without opening
 * the order.
 */

export const dynamic = "force-dynamic";

const PAYMENT_METHODS = {
  qlic:          { slug: "qlic",          label: "CliQ - الأردن" },
  vodafone_cash: { slug: "vodafone_cash", label: "فودافون كاش - مصر" },
} as const;

type MethodKey = keyof typeof PAYMENT_METHODS;

const schema = z.object({
  method:       z.enum(["qlic", "vodafone_cash"]),
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
  guestToken:  z.string().optional(),
  guestName:   z.string().max(120).optional(),
});

/** Build the admin-authored message seeded into the support ticket. */
function buildTicketMessage(opts: {
  method:        MethodKey;
  contactPhone:  string;
  totalAmount:   number;
  currency:      string;
  orderNumber:   string;
  customerEmail: string;
  customerName:  string;
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

/** Open a support ticket linked to a manual-payment order. */
async function openSupportTicket(input: {
  orderId:      number;
  customerId:   number;
  messageText:  string;
}): Promise<number> {
  const now = new Date().toISOString();
  const [ticket] = await prismaOrders.$queryRaw<{ id: number }[]>(Prisma.sql`
    INSERT INTO support_tickets (status, channel, updated_at, created_at)
    VALUES (
      'open'::"enum_support_tickets_status",
      'whatsapp'::"enum_support_tickets_channel",
      ${now}::timestamptz, ${now}::timestamptz
    )
    RETURNING id
  `);
  const ticketId = ticket.id;
  const messageRowId = crypto.randomBytes(12).toString("hex");
  await prismaOrders.$executeRaw(Prisma.sql`
    INSERT INTO support_tickets_messages (_order, _parent_id, id, sender, text, timestamp)
    VALUES (
      1, ${ticketId}, ${messageRowId},
      'admin'::"enum_support_tickets_messages_sender",
      ${input.messageText}, ${now}::timestamptz
    )
  `);
  await prismaOrders.$executeRaw(Prisma.sql`
    INSERT INTO support_tickets_rels (parent_id, path, orders_id)
    VALUES (${ticketId}, 'order', ${input.orderId})
  `);
  await prismaOrders.$executeRaw(Prisma.sql`
    INSERT INTO support_tickets_rels (parent_id, path, customers_id)
    VALUES (${ticketId}, 'customer', ${input.customerId})
  `);
  return ticketId;
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

    const identityResult = await resolveIdentity({ guestToken, guestName });
    if (identityResult.kind === "invalid_guest") {
      return NextResponse.json({ error: "رمز الضيف غير صالح أو منتهي" }, { status: 401 });
    }
    if (identityResult.kind === "anonymous") {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }
    const identity = identityResult.identity;

    const missing = await findMissingProductIds(items.map((i) => i.productId));
    if (missing.length > 0) {
      return NextResponse.json({ error: "بعض المنتجات غير موجودة" }, { status: 400 });
    }

    const customerId  = await getOrCreateCustomer(identity.customerEmail, identity.customerName);
    const orderNumber = await mintOrderNumber();
    const paymentRef  = `manual:${PAYMENT_METHODS[method].slug}:${contactPhone}`;

    const orderId = await createOrderForCustomer({
      orderNumber,
      totalAmount,
      currency,
      ip:               extractIP(req),
      userAgent:        extractUserAgent(req),
      paymentReference: paymentRef,
      customerId,
      customerEmail:    identity.customerEmail,
      items: items.map((i) => ({
        productId: i.productId,
        quantity:  i.quantity,
        unitPrice: i.unitPrice,
      })),
    });

    const ticketId = await openSupportTicket({
      orderId,
      customerId,
      messageText: buildTicketMessage({
        method,
        contactPhone,
        totalAmount,
        currency,
        orderNumber,
        customerEmail: identity.customerEmail,
        customerName:  identity.customerName,
      }),
    });

    console.log(
      `[manual-payment] ${method} order ${orderNumber} (id=${orderId}) — ticket ${ticketId} opened`
    );

    return NextResponse.json({
      orderId:     String(orderId),
      orderNumber,
      ticketId:    String(ticketId),
      method,
    });
  } catch (error: any) {
    // Log the full error surface — message alone hides which INSERT
    // inside the transaction failed on constraint violations.
    console.error("[manual-payment] failed:", error?.message, error?.stack, error?.code, error?.meta);
    return NextResponse.json(
      { error: "فشل إنشاء الطلب، يرجى المحاولة مرة أخرى" },
      { status: 500 }
    );
  }
}
