import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const schema = z.object({
  items: z.array(z.any()),
  action: z.enum(["update", "complete"]).default("update"),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      // Silently OK for guests — we don't track guest carts
      return NextResponse.json({ ok: true });
    }

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ ok: true });

    const { items, action } = parsed.data;
    const email = session.user.email;
    const name = session.user.name || email;
    const now = new Date().toISOString();

    if (action === "complete") {
      // Mark any active cart as completed when user checks out
      await prisma.$executeRaw(Prisma.sql`
        UPDATE abandoned_carts
        SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
        WHERE user_email = ${email} AND completed_at IS NULL
      `);
      return NextResponse.json({ ok: true });
    }

    if (items.length === 0) {
      // Empty cart — mark as completed (user cleared cart)
      await prisma.$executeRaw(Prisma.sql`
        UPDATE abandoned_carts
        SET completed_at = ${now}::timestamptz, updated_at = ${now}::timestamptz
        WHERE user_email = ${email} AND completed_at IS NULL
      `);
      return NextResponse.json({ ok: true });
    }

    // Upsert the abandoned cart record
    await prisma.$executeRaw(Prisma.sql`
      INSERT INTO abandoned_carts (user_email, user_name, cart_data, updated_at, created_at)
      VALUES (
        ${email}, ${name},
        ${JSON.stringify(items)}::jsonb,
        ${now}::timestamptz,
        ${now}::timestamptz
      )
      ON CONFLICT (user_email) WHERE completed_at IS NULL
      DO UPDATE SET
        cart_data = EXCLUDED.cart_data,
        user_name = EXCLUDED.user_name,
        updated_at = EXCLUDED.updated_at
    `);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    // Cart sync should never surface errors to the user
    console.error("[cart/sync]", error.message);
    return NextResponse.json({ ok: true });
  }
}
