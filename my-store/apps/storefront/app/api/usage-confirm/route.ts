import { NextRequest, NextResponse } from "next/server";
import { createEvidenceLog } from "@/lib/payload";
import { extractIP, extractUserAgent } from "@/lib/evidence";
import { z } from "zod";

const usageSchema = z.object({
  orderId: z.string(),
  customerId: z.string(),
  productId: z.string(),
  sessionId: z.string(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = usageSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "بيانات غير صالحة" },
        { status: 400 }
      );
    }

    const { orderId, customerId, productId, sessionId } = parsed.data;
    const ipAddress = extractIP(req);
    const userAgent = extractUserAgent(req);

    // Parse user agent for device info
    let device = "Unknown";
    let browser = "Unknown";
    if (userAgent.includes("Mobile")) device = "Mobile";
    else if (userAgent.includes("Tablet")) device = "Tablet";
    else device = "Desktop";

    if (userAgent.includes("Chrome") && !userAgent.includes("Edg"))
      browser = "Chrome";
    else if (userAgent.includes("Safari") && !userAgent.includes("Chrome"))
      browser = "Safari";
    else if (userAgent.includes("Firefox")) browser = "Firefox";
    else if (userAgent.includes("Edg")) browser = "Edge";

    const log = await createEvidenceLog({
      type: "usage_confirmation",
      order: orderId,
      customer: customerId,
      timestamp: new Date().toISOString(),
      ipAddress,
      userAgent,
      device,
      browser,
      sessionId,
      data: {
        productId,
        confirmedAt: new Date().toISOString(),
        confirmationType: "customer_explicit",
      },
    });

    return NextResponse.json({ success: true, logId: log.id });
  } catch (error: any) {
    console.error("Usage confirm error:", error);
    return NextResponse.json(
      { error: "فشل تأكيد الاستخدام" },
      { status: 500 }
    );
  }
}
