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
 * source='auto'.
 *
 * `orderId` is OPTIONAL. Two flows share this endpoint:
 *   - Orders page "Rate this product" — sends orderId; server verifies
 *     ownership. Duplicate check runs against the
 *     (order_id, product_id, customer_id) partial unique.
 *   - Product-detail page "Write a review" — no orderId, anyone signed
 *     in can review any product. Duplicate check runs against the
 *     (product_id, customer_id) partial unique that only covers rows
 *     with order_id IS NULL.
 *
 * `productId` is REQUIRED — the unique indexes need it, and both
 * client flows already send it.
 */

export const dynamic = "force-dynamic";

const schema = z.object({
  // orderId is optional; when omitted the review isn't tied to a
  // purchase. Order-owned reviews still verify ownership below.
  orderId:   z.union([z.string(), z.number()]).transform(Number).optional(),
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

    const customers = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE lower(email) = lower(${sessionEmail}) LIMIT 1`
    );
    if (!customers[0]?.id) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    const customerId = customers[0].id;

    // Only verify order ownership when the caller actually claims an
    // order. Product-detail reviews (no orderId) skip this and store
    // NULL for order_id.
    if (orderId) {
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
    }

    // Duplicate check scoped to whichever partial unique index will
    // catch this insert, so the client sees a friendly 409 instead of
    // a raw Postgres constraint error.
    const existing = orderId
      ? await prismaReviews.$queryRaw<{ id: number }[]>(
          Prisma.sql`
            SELECT id FROM reviews
             WHERE order_id = ${orderId}
               AND product_id = ${productId}
               AND customer_id = ${customerId}
             LIMIT 1
          `
        )
      : await prismaReviews.$queryRaw<{ id: number }[]>(
          Prisma.sql`
            SELECT id FROM reviews
             WHERE order_id IS NULL
               AND product_id = ${productId}
               AND customer_id = ${customerId}
             LIMIT 1
          `
        );
    if (existing[0]) {
      return NextResponse.json({ error: "تم تقييم هذا المنتج مسبقاً" }, { status: 409 });
    }

    // Customer-submitted reviews start as 'pending' and only appear on
    // the public product page once an admin approves them in the admin
    // panel. Auto-sweep reviews (source='auto') are inserted elsewhere
    // as 'approved' since they're implicit 5-star ratings from the
    // 7-day delivery sweep, not user commentary.
    const [review] = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO reviews (order_id, product_id, customer_id, rating, comment, source, status, created_at, updated_at)
        VALUES (${orderId ?? null}, ${productId}, ${customerId}, ${rating}, ${reviewText ?? null}, 'customer', 'pending', NOW(), NOW())
        RETURNING id
      `
    );

    if (!review) {
      return NextResponse.json({ error: "فشل إرسال التقييم" }, { status: 500 });
    }

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error: any) {
    // 23505 = Postgres unique_violation. Reachable if a concurrent
    // request slipped in between our duplicate check and the insert.
    if (error?.code === "P2002" || /unique/i.test(String(error?.message))) {
      return NextResponse.json({ error: "تم تقييم هذا المنتج مسبقاً" }, { status: 409 });
    }
    console.error("Review error:", error);
    return NextResponse.json({ error: "فشل إرسال التقييم" }, { status: 500 });
  }
}

/**
 * GET /api/reviews
 *
 * Three modes:
 *   ?orderId=…&productId=…  → has THIS customer reviewed this exact
 *                              (order, product) pair? (Orders page.)
 *   ?orderId=…              → does ANY review exist for this order?
 *                              (Back-compat with the older client.)
 *   ?productId=…            → has the signed-in customer left ANY
 *                              review (with or without an order) for
 *                              this product? (Product-detail page.)
 */
export async function GET(req: NextRequest) {
  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  const productIdParam = req.nextUrl.searchParams.get("productId");
  const productId = productIdParam ? Number(productIdParam) : null;

  // productId-only mode -- needs the signed-in customer.
  if (!orderId && productId) {
    const session = await auth();
    const sessionEmail = normalizeEmail(session?.user?.email);
    if (!sessionEmail) return NextResponse.json({ reviewed: false });

    const rows = await prismaReviews.$queryRaw<{ id: number; rating: number }[]>(
      Prisma.sql`
        SELECT r.id, r.rating
          FROM reviews r
          JOIN customers c ON c.id = r.customer_id
         WHERE r.product_id = ${productId}
           AND lower(c.email) = lower(${sessionEmail})
         ORDER BY r.id DESC
         LIMIT 1
      `
    );
    return NextResponse.json({ reviewed: !!rows[0], rating: rows[0]?.rating });
  }

  if (!orderId) return NextResponse.json({ reviewed: false });

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
