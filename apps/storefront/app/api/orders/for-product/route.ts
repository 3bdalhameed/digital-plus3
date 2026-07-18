import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";

/**
 * GET /api/orders/for-product?productId=NN
 *
 * Returns the caller's most recent order that contains this product.
 * Used by the product detail page's "Write a review" flow so we can
 * attach the review to a real order (POST /api/reviews requires an
 * orderId). Only returns an order the caller actually owns.
 *
 * Response:
 *   { orderId: number | null, existingRating: number | null }
 *
 * `existingRating` is set when the visitor has already reviewed this
 * product for the returned order -- lets the UI hide the form and
 * show the existing rating instead of a "duplicate review" 409.
 */
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ orderId: null, existingRating: null });
  }

  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  if (!email) return NextResponse.json({ orderId: null, existingRating: null });

  try {
    // Find customer.
    const customers = await prisma.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE email = ${email} LIMIT 1`
    );
    const customerId = customers[0]?.id;
    if (!customerId) return NextResponse.json({ orderId: null, existingRating: null });

    // Most recent order owned by this customer that contains this product.
    const orders = await prisma.$queryRaw<{ id: number }[]>(Prisma.sql`
      SELECT DISTINCT o.id
        FROM orders o
        JOIN orders_rels rcust
          ON rcust.parent_id = o.id AND rcust.path = 'customer' AND rcust.customers_id = ${customerId}
        JOIN orders_rels rprod
          ON rprod.parent_id = o.id AND rprod.path LIKE 'items.%.product' AND rprod.products_id = ${productId}
       ORDER BY o.id DESC
       LIMIT 1
    `);
    const orderId = orders[0]?.id ?? null;
    if (!orderId) return NextResponse.json({ orderId: null, existingRating: null });

    // If they've already reviewed it, tell the client so it can show
    // the rating instead of the form.
    const existing = await prisma.$queryRaw<{ rating: number }[]>(Prisma.sql`
      SELECT rating FROM reviews
       WHERE order_id = ${orderId}
         AND product_id = ${productId}
         AND customer_id = ${customerId}
       LIMIT 1
    `);

    return NextResponse.json({
      orderId,
      existingRating: existing[0]?.rating ?? null,
    });
  } catch (e) {
    console.error("[orders/for-product] failed:", e);
    return NextResponse.json({ orderId: null, existingRating: null });
  }
}
