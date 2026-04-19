import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrder, getOrderEvidence } from "@/lib/payload";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const [order, evidence] = await Promise.all([
      getOrder(params.id),
      getOrderEvidence(params.id),
    ]);

    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Group evidence by type
    const bundle = {
      orderId: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customer?.id,
        email: order.customer?.email,
        name: order.customer?.name,
      },
      termsAcceptance: evidence.filter(
        (e: any) => e.type === "terms_acceptance"
      ),
      paymentLogs: evidence.filter((e: any) => e.type === "payment"),
      deliveryLogs: evidence.filter((e: any) => e.type === "delivery"),
      accessLogs: evidence.filter((e: any) => e.type === "access"),
      usageConfirmation: evidence.filter(
        (e: any) => e.type === "usage_confirmation"
      ),
      supportNotes: evidence.filter((e: any) => e.type === "support_note"),
      screenshots: evidence.filter((e: any) => e.type === "screenshot"),
      totalEvidenceCount: evidence.length,
      generatedAt: new Date().toISOString(),
    };

    return NextResponse.json(bundle);
  } catch (error: any) {
    console.error("Evidence bundle error:", error);
    return NextResponse.json(
      { error: "فشل تحميل بيانات الأدلة" },
      { status: 500 }
    );
  }
}
