import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { sendAbandonedCartEmail } from "@/lib/email";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    type CartRow = {
      id: number;
      user_email: string;
      user_name: string | null;
      cart_data: any;
      first_reminder_sent_at: Date | null;
      second_reminder_sent_at: Date | null;
      updated_at: Date;
    };

    // Carts abandoned for 3+ hours, first reminder not yet sent
    const firstBatch = await prisma.$queryRaw<CartRow[]>(Prisma.sql`
      SELECT id, user_email, user_name, cart_data, first_reminder_sent_at, second_reminder_sent_at, updated_at
      FROM abandoned_carts
      WHERE completed_at IS NULL
        AND first_reminder_sent_at IS NULL
        AND updated_at < NOW() - INTERVAL '3 hours'
        AND jsonb_array_length(cart_data) > 0
    `);

    // Carts abandoned 6+ hours since first reminder, second not yet sent
    const secondBatch = await prisma.$queryRaw<CartRow[]>(Prisma.sql`
      SELECT id, user_email, user_name, cart_data, first_reminder_sent_at, second_reminder_sent_at, updated_at
      FROM abandoned_carts
      WHERE completed_at IS NULL
        AND first_reminder_sent_at IS NOT NULL
        AND second_reminder_sent_at IS NULL
        AND first_reminder_sent_at < NOW() - INTERVAL '3 hours'
        AND jsonb_array_length(cart_data) > 0
    `);

    let sent = 0;

    for (const cart of firstBatch) {
      const items = Array.isArray(cart.cart_data) ? cart.cart_data : [];
      const result = await sendAbandonedCartEmail({
        customerName: cart.user_name || cart.user_email,
        customerEmail: cart.user_email,
        cartItems: items.map((i: any) => ({
          name: i.name || "منتج",
          quantity: i.quantity || 1,
          price: i.price || 0,
          currency: i.currency || "USD",
        })),
        reminderNumber: 1,
      });

      if (result.success) {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE abandoned_carts
          SET first_reminder_sent_at = ${now.toISOString()}::timestamptz,
              updated_at = ${now.toISOString()}::timestamptz
          WHERE id = ${cart.id}
        `);
        sent++;
        console.log(`[abandoned-cart] 1st reminder → ${cart.user_email}`);
      }
    }

    for (const cart of secondBatch) {
      const items = Array.isArray(cart.cart_data) ? cart.cart_data : [];
      const result = await sendAbandonedCartEmail({
        customerName: cart.user_name || cart.user_email,
        customerEmail: cart.user_email,
        cartItems: items.map((i: any) => ({
          name: i.name || "منتج",
          quantity: i.quantity || 1,
          price: i.price || 0,
          currency: i.currency || "USD",
        })),
        reminderNumber: 2,
      });

      if (result.success) {
        await prisma.$executeRaw(Prisma.sql`
          UPDATE abandoned_carts
          SET second_reminder_sent_at = ${now.toISOString()}::timestamptz,
              updated_at = ${now.toISOString()}::timestamptz
          WHERE id = ${cart.id}
        `);
        sent++;
        console.log(`[abandoned-cart] 2nd reminder → ${cart.user_email}`);
      }
    }

    return NextResponse.json({
      ok: true,
      firstReminders: firstBatch.length,
      secondReminders: secondBatch.length,
      sent,
    });
  } catch (error: any) {
    console.error("[abandoned-cart cron]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
