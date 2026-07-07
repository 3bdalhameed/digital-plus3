import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getOrder } from "@/lib/payload";

/**
 * POST /api/orders/:id/confirm
 *
 * Customer-triggered order confirmation: flips a paid order to
 * "delivered" NOW instead of waiting for the 7-day auto-confirm sweep.
 *
 * Guards:
 *   - authenticated session
 *   - order belongs to the logged-in customer (matched by email since
 *     that's the identifier we carry in the NextAuth session)
 *   - order is currently `paid` -- any other status is a no-op with
 *     the current status returned so the client can refresh state
 */
export const dynamic = "force-dynamic";

const CMS = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";
const INTERNAL_SECRET = process.env.PAYLOAD_INTERNAL_SECRET || "";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: "غير مصرح" }, { status: 401 });
    }

    const order = await getOrder(params.id).catch(() => null);
    if (!order) {
      return NextResponse.json({ error: "الطلب غير موجود" }, { status: 404 });
    }

    // Ownership check: order.customer.email must match session email.
    const orderEmail = (order as any)?.customer?.email;
    if (!orderEmail || orderEmail !== session.user.email) {
      return NextResponse.json({ error: "لا يمكنك تعديل هذا الطلب" }, { status: 403 });
    }

    // Only paid orders are eligible. Delivered is already the target
    // state (idempotent), refunded/cancelled/pending etc. shouldn't
    // be manually confirmed.
    if (order.status === "delivered") {
      return NextResponse.json({ ok: true, status: "delivered", changed: false });
    }
    if (order.status !== "paid") {
      return NextResponse.json(
        { error: "لا يمكن تأكيد الطلب في حالته الحالية", status: order.status },
        { status: 409 }
      );
    }

    // Flip status to delivered via Payload. The internal secret grants
    // write access (see cms/src/access.ts fromStorefront helper).
    // confirmedBy='customer' distinguishes this from the 7-day auto-
    // sweep which sets 'auto' -- support can tell them apart in the
    // admin list view.
    const res = await fetch(`${CMS}/orders/${params.id}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": INTERNAL_SECRET,
      },
      body: JSON.stringify({ status: "delivered", confirmedBy: "customer" }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error(`[confirm-order] Payload PATCH failed ${res.status}`, body);
      return NextResponse.json({ error: "فشل تأكيد الطلب" }, { status: 502 });
    }

    return NextResponse.json({ ok: true, status: "delivered", changed: true });
  } catch (err: any) {
    console.error("[confirm-order] unexpected error:", err?.message);
    return NextResponse.json({ error: "خطأ داخلي" }, { status: 500 });
  }
}
