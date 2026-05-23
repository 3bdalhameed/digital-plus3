import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma as prismaUsage } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const usageSchema = z.object({
  orderId: z.union([z.string(), z.number()]).transform((v) => Number(v)),
  productId: z.string().optional(),
  sessionId: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = usageSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "بيانات غير صالحة" }, { status: 400 });
    }

    const { orderId, productId, sessionId } = parsed.data;

    // Look up customer in Neon by session email
    const customers = await prismaUsage.$queryRaw<{ id: number }[]>(
      Prisma.sql`SELECT id FROM customers WHERE email = ${session.user.email} LIMIT 1`
    );
    if (!customers[0]?.id) {
      return NextResponse.json({ error: "العميل غير موجود" }, { status: 404 });
    }
    const customerId = customers[0].id;

    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);
    let device = "Desktop";
    if (userAgent.includes("Mobile")) device = "Mobile";
    else if (userAgent.includes("Tablet")) device = "Tablet";
    let browser = "Unknown";
    if (userAgent.includes("Chrome") && !userAgent.includes("Edg")) browser = "Chrome";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";

    const now = new Date();

    const [log] = await prismaUsage.$queryRaw<{ id: number }[]>(
      Prisma.sql`
        INSERT INTO evidence_logs (
          type, timestamp, ip_address, user_agent, device, browser, session_id, data,
          updated_at, created_at
        )
        VALUES (
          'usage_confirmation'::"enum_evidence_logs_type",
          ${now.toISOString()}::timestamptz,
          ${ipAddress}, ${userAgent}, ${device}, ${browser},
          ${sessionId ?? null},
          ${JSON.stringify({ productId, confirmedAt: now.toISOString(), confirmationType: "customer_explicit" })}::jsonb,
          ${now.toISOString()}::timestamptz,
          ${now.toISOString()}::timestamptz
        )
        RETURNING id
      `
    );
    const logId = log.id;

    await prismaUsage.$executeRaw(
      Prisma.sql`INSERT INTO evidence_logs_rels (parent_id, path, customers_id) VALUES (${logId}, 'customer', ${customerId})`
    );
    await prismaUsage.$executeRaw(
      Prisma.sql`INSERT INTO evidence_logs_rels (parent_id, path, orders_id) VALUES (${logId}, 'order', ${orderId})`
    );

    return NextResponse.json({ success: true, logId });
  } catch (error: any) {
    console.error("Usage confirm error:", error);
    return NextResponse.json({ error: "فشل تأكيد الاستخدام" }, { status: 500 });
  }
}
