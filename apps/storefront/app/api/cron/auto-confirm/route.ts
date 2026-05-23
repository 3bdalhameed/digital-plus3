import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// Vercel Cron calls this with the Authorization header set to CRON_SECRET
function isAuthorized(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true; // dev: no secret required
  return req.headers.get("authorization") === `Bearer ${secret}`;
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // Find paid/delivered orders older than 7 days with no usage_confirmation evidence
    type OrderRow = { id: number; order_number: string; customer_id: number };
    const staleOrders = await prisma.$queryRaw<OrderRow[]>(Prisma.sql`
      SELECT DISTINCT o.id, o.order_number, r.customers_id AS customer_id
      FROM orders o
      JOIN orders_rels r ON r.parent_id = o.id AND r.path = 'customer'
      WHERE o.status IN ('paid', 'delivered')
        AND o.created_at < NOW() - INTERVAL '7 days'
        AND NOT EXISTS (
          SELECT 1 FROM evidence_logs el
          JOIN evidence_logs_rels elr ON elr.parent_id = el.id AND elr.path = 'order'
          WHERE elr.orders_id = o.id AND el.type = 'usage_confirmation'
        )
        AND NOT EXISTS (
          SELECT 1 FROM product_reviews pr
          WHERE pr.order_id = o.id AND pr.is_auto = false
        )
    `);

    let confirmed = 0;
    let rated = 0;

    for (const order of staleOrders) {
      const now = new Date();

      // Auto-create usage_confirmation evidence log
      const [log] = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
        INSERT INTO evidence_logs (type, timestamp, ip_address, user_agent, data, updated_at, created_at)
        VALUES (
          'usage_confirmation'::"enum_evidence_logs_type",
          ${now.toISOString()}::timestamptz,
          'system', 'auto-confirm-cron',
          '{"source":"auto_confirm","reason":"7_days_no_action"}'::jsonb,
          ${now.toISOString()}::timestamptz,
          ${now.toISOString()}::timestamptz
        )
        RETURNING id
      `);

      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO evidence_logs_rels (parent_id, path, customers_id)
        VALUES (${log.id}, 'customer', ${order.customer_id})
      `);
      await prisma.$executeRaw(Prisma.sql`
        INSERT INTO evidence_logs_rels (parent_id, path, orders_id)
        VALUES (${log.id}, 'order', ${order.id})
      `);
      confirmed++;

      // Auto-submit 5-star rating
      const alreadyRated = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
        SELECT id FROM product_reviews WHERE order_id = ${order.id} LIMIT 1
      `);
      if (!alreadyRated[0]) {
        await prisma.$executeRaw(Prisma.sql`
          INSERT INTO product_reviews (order_id, customer_id, rating, review_text, is_auto, created_at)
          VALUES (${order.id}, ${order.customer_id}, 5, 'تقييم تلقائي — لم يتم الإلغاء خلال 7 أيام', true, ${now.toISOString()}::timestamptz)
        `);
        rated++;
      }

      console.log(`[auto-confirm] order ${order.order_number} auto-confirmed`);
    }

    return NextResponse.json({
      ok: true,
      processed: staleOrders.length,
      confirmed,
      rated,
    });
  } catch (error: any) {
    console.error("[auto-confirm] error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
