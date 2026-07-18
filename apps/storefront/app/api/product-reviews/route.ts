import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/product-reviews?productId=NN[&limit=20]
 *
 * Returns approved reviews for a product, ordered newest first, with
 * the reviewer's name masked (first letter + "***"). Only reviews
 * with status='approved' are returned -- pending/rejected reviews
 * live in the DB but never render on the public product page.
 *
 * Response:
 *   {
 *     count: number,
 *     average: number,
 *     reviews: [
 *       { id, rating, comment, reviewerName, source, createdAt }
 *     ]
 *   }
 */
export const dynamic = "force-dynamic";

function maskName(raw: string | null): string {
  const name = (raw ?? "").trim();
  if (!name) return "***";
  // Show the first grapheme + "***" so display is consistent across
  // Latin and Arabic names (both get "A***" / "أ***").
  const first = Array.from(name)[0] ?? "?";
  return `${first}***`;
}

export async function GET(req: NextRequest) {
  const productId = Number(req.nextUrl.searchParams.get("productId"));
  if (!Number.isFinite(productId) || productId <= 0) {
    return NextResponse.json({ count: 0, average: 0, reviews: [] });
  }
  const limit = Math.min(
    Math.max(1, Number(req.nextUrl.searchParams.get("limit") ?? 20)),
    100,
  );

  try {
    // Fetch approved reviews + a rolling aggregate in one round-trip.
    // Auto-source reviews still count toward the average (they're
    // implicit 5-star ratings from the 7-day sweep, marked approved
    // by design) but are flagged so the UI can label them.
    const rows = await prisma.$queryRaw<
      {
        id: number;
        rating: number;
        comment: string | null;
        source: string;
        created_at: Date;
        customer_name: string | null;
      }[]
    >(Prisma.sql`
      SELECT r.id, r.rating, r.comment, r.source, r.created_at,
             c.name AS customer_name
        FROM reviews r
        JOIN customers c ON c.id = r.customer_id
       WHERE r.product_id = ${productId}
         AND r.status     = 'approved'
       ORDER BY r.created_at DESC
       LIMIT ${limit}
    `);

    const [agg] = await prisma.$queryRaw<{ n: bigint; avg: number | null }[]>(
      Prisma.sql`
        SELECT COUNT(*)::bigint AS n, AVG(rating)::float AS avg
          FROM reviews
         WHERE product_id = ${productId} AND status = 'approved'
      `,
    );

    return NextResponse.json({
      count:   Number(agg?.n ?? 0),
      average: Math.round(((agg?.avg ?? 0) as number) * 10) / 10,
      reviews: rows.map((r) => ({
        id:           r.id,
        rating:       r.rating,
        comment:      r.comment,
        reviewerName: maskName(r.customer_name),
        source:       r.source,
        createdAt:    r.created_at.toISOString(),
      })),
    });
  } catch (e) {
    console.error("[product-reviews] failed:", e);
    return NextResponse.json({ count: 0, average: 0, reviews: [] });
  }
}
