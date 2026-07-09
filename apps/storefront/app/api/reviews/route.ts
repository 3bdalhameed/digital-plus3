import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma as prismaReviews } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";

/**
 * Reviews API — POST creates a review, GET checks review status.
 *
 * Writes to the unified `reviews` table (source='customer'). The
 * 7-day maintenance sweep in the CMS writes to the same table with
 * source='auto'. Both flows share a unique index on
 * (order_id, product_id, customer_id) so a given customer can only
 * review each product-in-an-order once, whether manually or via
 * the auto-sweep.
 *
 * `productId` is now REQUIRED — the previous endpoint let it be
 * optional but that conflicts with the unique index (three NULLs are
 * distinct in Postgres, letting duplicates slip through). Frontend
 * already sends it; making it required just enforces what's
 * already true in practice.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  orderId:   z.union([z.string(), z.number()]).transform(Number),
  productId: z.union([z.string(), z.number()]).transform(Number),
  rating:    z.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { orderId, productId, rating, reviewText } = parsed.data;

    // Verify customer owns this order (join via orders_rels since Payload
    // stores the customer relation there for its access-control filters).
    const customers = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE email = ${sessionEmail} LIMIT 1`
    );
    if (!customers[0]?.id) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    const customerId = customers[0].id;

    const orderCheck = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        SELECT o.id FROM orders o
        JOIN orders_rels r ON r.parent_id = o.id AND r.path = 'customer'
        WHERE o.id = ${orderId} AND r.customers_id = ${customerId}
        LIMIT 1
      `
    );
    if (!orderCheck[0]) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Duplicate check scoped to (order, product, customer) — matches the
    // unique index so the client gets a friendly 409 instead of a raw
    // Postgres constraint error.
    const existing = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        SELECT id FROM reviews
         WHERE order_id = ${orderId}
           AND product_id = ${productId}
           AND customer_id = ${customerId}
         LIMIT 1
      `
    );
    if (existing[0]) {
      return NextResponse.json({ error: "تم تقييم هذا المنتج مسبقاً" }, { status: 409 });
    }

    const [review] = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO reviews (order_id, product_id, customer_id, rating, comment, source, created_at, updated_at)
        VALUES (${orderId}, ${productId}, ${customerId}, ${rating}, ${reviewText ?? null}, 'customer', NOW(), NOW())
        ON CONFLICT (order_id, product_id, customer_id) DO NOTHING
        RETURNING id
      `
    );

    if (!review) {
      // Only reachable if a concurrent request slipped in between our
      // duplicate check and the insert.
      return NextResponse.json({ error: "تم تقييم هذا المنتج مسبقاً" }, { status: 409 });
    }

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error: any) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "فشل إرسال التقييم" }, { status: 500 });
  }
}

/**
 * GET /api/reviews?orderId=…&productId=…
 * Returns whether the caller has already reviewed a specific
 * order+product pair. If productId is omitted we return whether ANY
 * review exists for the order (back-compat with the older client).
 */
export async function GET(req: NextRequest) {
  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  const productIdParam = req.nextUrl.searchParams.get("productId");
  if (!orderId) return NextResponse.json({ reviewed: false });

  const productId = productIdParam ? Number(productIdParam) : null;
  const rows = productId
    ? await prismaReviews.$queryRaw<{ id: number; rating: number }[]>(
        Prisma.sql`
          SELECT id, rating FROM reviews
           WHERE order_id = ${orderId} AND product_id = ${productId}
           LIMIT 1
        `
      )
    : await prismaReviews.$queryRaw<{ id: number; rating: number }[]>(
        Prisma.sql`SELECT id, rating FROM reviews WHERE order_id = ${orderId} LIMIT 1`
      );

  return NextResponse.json({ reviewed: !!rows[0], rating: rows[0]?.rating });
}
