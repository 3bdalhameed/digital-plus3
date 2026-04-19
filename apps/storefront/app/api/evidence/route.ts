import { NextRequest, NextResponse } from "next/server";
import { createEvidenceLog } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";

const evidenceSchema = z.object({
  type: z.enum([
    "terms_acceptance",
    "payment",
    "delivery",
    "access",
    "usage_confirmation",
    "support_note",
    "screenshot",
  ]),
  orderId: z.string().optional(),
  customerId: z.string(),
  sessionId: z.string().optional(),
  device: z.string().optional(),
  browser: z.string().optional(),
  data: z.record(z.any()).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = evidenceSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { type, orderId, customerId, sessionId, device, browser, data } =
      parsed.data;

    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);

    const log = await createEvidenceLog({
      type,
      order: orderId,
      customer: customerId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      device,
      browser,
      sessionId,
      data: {
        ...data,
        loggedAt: new Date().toISOString(),
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error: any) {
    console.error("Evidence log error:", error);
    return NextResponse.json(
      { error: "فشل تسجيل البيانات" },
      { status: 500 }
    );
  }
}
