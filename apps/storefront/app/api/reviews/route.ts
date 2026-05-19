import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { PrismaClient, Prisma } from "@prisma/client";
import { z } from "zod";

export const dynamic = "force-dynamic";

const globalForPrisma = global as unknown as { __reviewsPrisma: PrismaClient };
const prismaReviews =
  globalForPrisma.__reviewsPrisma ||
  new PrismaClient({
    datasources: {
      db: { url: process.env.CMS_DATABASE_URL || process.env.DATABASE_URL },
    },
  });
if (process.env.NODE_ENV !== "production")
  globalForPrisma.__reviewsPrisma = prismaReviews;

const schema = z.object({
  orderId: z.union([z.string(), z.number()]).transform(Number),
  productId: z.union([z.string(), z.number()]).transform(Number).optional(),
  rating: z.number().int().min(1).max(5),
  reviewText: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { orderId, productId, rating, reviewText } = parsed.data;

    // Verify customer owns this order
    const customers = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE email = ${session.user.email} LIMIT 1`
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

    // Prevent duplicate reviews for same order
    const existing = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM product_reviews WHERE order_id = ${orderId} AND customer_id = ${customerId} LIMIT 1`
    );
    if (existing[0]) {
      return NextResponse.json({ error: "تم تقييم هذا الطلب مسبقاً" }, { status: 409 });
    }

    const [review] = await prismaReviews.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO product_reviews (order_id, customer_id, product_id, rating, review_text, is_auto)
        VALUES (${orderId}, ${customerId}, ${productId ?? null}, ${rating}, ${reviewText ?? null}, false)
        RETURNING id
      `
    );

    return NextResponse.json({ success: true, reviewId: review.id });
  } catch (error: any) {
    console.error("Review error:", error);
    return NextResponse.json({ error: "فشل إرسال التقييم" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const orderId = Number(req.nextUrl.searchParams.get("orderId"));
  if (!orderId) return NextResponse.json({ reviewed: false });

  const rows = await prismaReviews.$queryRaw<{ id: number; rating: number }[]>(
    Prisma.sql`SELECT id, rating FROM product_reviews WHERE order_id = ${orderId} LIMIT 1`
  );
  return NextResponse.json({ reviewed: !!rows[0], rating: rows[0]?.rating });
}
