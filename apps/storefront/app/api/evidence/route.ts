import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";
import { PrismaClient, Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

// Direct connection to Neon (same DB the storefront reads from)
const globalForPrisma = global as unknown as { __evidencePrisma: PrismaClient };
const prismaEvidence =
  globalForPrisma.__evidencePrisma ||
  new PrismaClient({
    datasources: {
      db: { url: process.env.CMS_DATABASE_URL || process.env.DATABASE_URL },
    },
  });
if (process.env.NODE_ENV !== "production")
  globalForPrisma.__evidencePrisma = prismaEvidence;

const schema = z.object({
  type: z.enum([
    "terms_acceptance",
    "payment",
    "delivery",
    "access",
    "usage_confirmation",
    "support_note",
    "screenshot",
  ]),
  orderId: z
    .union([z.string(), z.number()])
    .transform((v) => (v != null && v !== "" ? Number(v) : undefined))
    .optional(),
  sessionId: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  data: z.record(z.any()).optional(),
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
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { type, orderId, sessionId, device, browser, data } = parsed.data;

    // Look up (or create) customer in Neon by session email
    const existing = await prismaEvidence.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE email = ${session.user.email} LIMIT 1`
    );
    let customerId: number;
    if (existing[0]?.id) {
      customerId = existing[0].id;
    } else {
      const created = await prismaEvidence.$queryRaw<{ id: number }[]>(
        Prisma.sql`
          INSERT INTO customers (email, name, updated_at, created_at)
          VALUES (${session.user.email}, ${session.user.name || session.user.email}, NOW(), NOW())
          RETURNING id
        `
      );
      customerId = created[0].id;
    }

    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);
    const now = new Date();

    // Insert evidence log directly into Neon
    const [log] = await prismaEvidence.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO evidence_logs (
          type, timestamp, ip_address, user_agent,
          device, browser, session_id, data,
          updated_at, created_at
        )
        VALUES (
          ${type}::"enum_evidence_logs_type",
          ${now.toISOString()}::timestamptz,
          ${ipAddress},
          ${userAgent},
          ${device ?? null},
          ${browser ?? null},
          ${sessionId ?? null},
          ${data ? JSON.stringify(data) : null}::jsonb,
          ${now.toISOString()}::timestamptz,
          ${now.toISOString()}::timestamptz
        )
        RETURNING id
      `
    );
    const logId = log.id;

    // Link customer
    await prismaEvidence.$executeRaw(
      Prisma.sql`
        INSERT INTO evidence_logs_rels (parent_id, path, customers_id)
        VALUES (${logId}, 'customer', ${customerId})
      `
    );

    // Link order if provided
    if (orderId) {
      await prismaEvidence.$executeRaw(
        Prisma.sql`
          INSERT INTO evidence_logs_rels (parent_id, path, orders_id)
          VALUES (${logId}, 'order', ${orderId})
        `
      );
    }

    return NextResponse.json({ success: true, logId });
  } catch (error: any) {
    console.error("Evidence log error:", error);
    return NextResponse.json(
      { error: "فشل تسجيل البيانات" },
      { status: 500 }
    );
  }
}
