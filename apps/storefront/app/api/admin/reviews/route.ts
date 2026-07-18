import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizeEmail } from "@/lib/normalize-email";

/**
 * Admin API for the review-moderation queue.
 *
 * - GET  → list pending reviews (default) or filter by ?status=…
 * - POST → { id, status } to approve / reject / re-pend a review
 *
 * Gated by Payload's `users` table -- anyone signed in on the
 * storefront whose email matches a CMS user with role in
 * {super_admin, admin, catalog} can moderate. Same set that already
 * has write access to Media / Products / Orders in the CMS admin,
 * so the moderation permission piggybacks on existing role config
 * (no separate ADMIN_EMAILS env var to keep in sync).
 *
 * We hit `users` via $queryRaw because Prisma's schema only models
 * the NextAuth tables (Account/Session/User) -- the Payload-managed
 * `users` collection lives in the same DB but isn't in schema.prisma.
 */
export const dynamic = "force-dynamic";

const ADMIN_ROLES = new Set(["super_admin", "admin", "catalog"]);

async function requireAdmin(): Promise<
  { ok: true } | { ok: false; error: string; status: number }
> {
  const session = await auth();
  const email = normalizeEmail(session?.user?.email);
  if (!email) return { ok: false, error: "غير مصرح", status: 401 };

  try {
    const rows = await prisma.$queryRaw<{ role: string | null }[]>(
      Prisma.sql`SELECT role FROM users WHERE lower(email) = ${email} LIMIT 1`,
    );
    const role = rows[0]?.role ?? null;
    if (!role || !ADMIN_ROLES.has(role)) {
      return { ok: false, error: "ممنوع", status: 403 };
    }
  } catch {
    // If the users lookup fails (DB down, table missing) don't leak the
    // moderation queue -- treat as forbidden.
    return { ok: false, error: "تعذّر التحقق من الصلاحيات", status: 503 };
  }
  return { ok: true };
}

export async function GET(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  const status = (req.nextUrl.searchParams.get("status") ?? "pending").toLowerCase();
  const allowed = new Set(["pending", "approved", "rejected", "all"]);
  const filter = allowed.has(status) ? status : "pending";

  const rows = await prisma.$queryRaw<
    {
      id: number;
      product_id: number;
      order_id: number;
      rating: number;
      comment: string | null;
      source: string;
      status: string;
      created_at: Date;
      product_name: string | null;
      product_slug: string | null;
      customer_email: string | null;
      customer_name: string | null;
    }[]
  >(
    filter === "all"
      ? Prisma.sql`
          SELECT r.id, r.product_id, r.order_id, r.rating, r.comment,
                 r.source, r.status, r.created_at,
                 p.name_ar AS product_name, p.slug AS product_slug,
                 c.email   AS customer_email, c.name AS customer_name
            FROM reviews r
            LEFT JOIN products  p ON p.id = r.product_id
            LEFT JOIN customers c ON c.id = r.customer_id
           ORDER BY r.created_at DESC
           LIMIT 200
        `
      : Prisma.sql`
          SELECT r.id, r.product_id, r.order_id, r.rating, r.comment,
                 r.source, r.status, r.created_at,
                 p.name_ar AS product_name, p.slug AS product_slug,
                 c.email   AS customer_email, c.name AS customer_name
            FROM reviews r
            LEFT JOIN products  p ON p.id = r.product_id
            LEFT JOIN customers c ON c.id = r.customer_id
           WHERE r.status = ${filter}
           ORDER BY r.created_at DESC
           LIMIT 200
        `,
  );

  return NextResponse.json({
    reviews: rows.map((r) => ({
      id:            r.id,
      productId:     r.product_id,
      orderId:       r.order_id,
      rating:        r.rating,
      comment:       r.comment,
      source:        r.source,
      status:        r.status,
      createdAt:     r.created_at.toISOString(),
      productName:   r.product_name,
      productSlug:   r.product_slug,
      customerEmail: r.customer_email,
      customerName:  r.customer_name,
    })),
  });
}

export async function POST(req: NextRequest) {
  const gate = await requireAdmin();
  if (!gate.ok) return NextResponse.json({ error: gate.error }, { status: gate.status });

  let body: { id?: unknown; status?: unknown };
  try { body = await req.json(); } catch {
    return NextResponse.json({ error: "طلب غير صالح" }, { status: 400 });
  }
  const id = Number(body.id);
  const status = String(body.status ?? "").toLowerCase();
  if (!Number.isFinite(id) || id <= 0) {
    return NextResponse.json({ error: "معرّف تقييم غير صالح" }, { status: 400 });
  }
  if (!["approved", "rejected", "pending"].includes(status)) {
    return NextResponse.json({ error: "حالة غير صالحة" }, { status: 400 });
  }

  await prisma.$executeRaw(Prisma.sql`
    UPDATE reviews
       SET status = ${status}, updated_at = NOW()
     WHERE id = ${id}
  `);

  return NextResponse.json({ ok: true });
}
