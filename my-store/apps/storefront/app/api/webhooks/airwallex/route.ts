import { NextRequest, NextResponse } from "next/server";
import { verifyWebhookSignature } from "@/lib/airwallex";
import { createEvidenceLog } from "@/lib/payload";
import { sendOrderConfirmationEmail } from "@/lib/email";

const PAYLOAD_API_URL = process.env.PAYLOAD_API_URL || "http://localhost:3001/api";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-signature") || "";
    const timestamp = req.headers.get("x-timestamp") || "";

    // Verify webhook signature
    if (process.env.AIRWALLEX_WEBHOOK_SECRET) {
      const isValid = verifyWebhookSignature(rawBody, signature, timestamp);
      if (!isValid) {
        console.error("Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(rawBody);
    const eventType = event.name || event.type;

    if (eventType === "payment_intent.succeeded") {
      const intentData = event.data?.object || event.data;
      const orderId = intentData?.metadata?.orderId;
      const customerId = intentData?.metadata?.customerId;

      if (!orderId) {
        console.error("No orderId in webhook metadata");
        return NextResponse.json({ received: true });
      }

      // 1. Update order status to "paid"
      await fetch(`${PAYLOAD_API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "paid",
          paymentReference: intentData.id,
          airwallexPaymentIntentId: intentData.id,
        }),
      });

      // 2. Log payment success as evidence
      await createEvidenceLog({
        type: "payment",
        order: orderId,
        customer: customerId,
        timestamp: new Date().toISOString(),
        ipAddress: "webhook",
        userAgent: "airwallex-webhook",
        data: {
          airwallexIntentId: intentData.id,
          amount: intentData.amount,
          currency: intentData.currency,
          status: "succeeded",
          rawEvent: eventType,
        },
      });

      // 3. Trigger digital delivery
      // Fetch order details for email
      const orderRes = await fetch(
        `${PAYLOAD_API_URL}/orders/${orderId}?depth=2`
      );
      const order = await orderRes.json();

      // Update delivery status
      await fetch(`${PAYLOAD_API_URL}/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "delivered",
          deliveryStatus: "sent",
          deliveredAt: new Date().toISOString(),
          digitalDeliveryLog: {
            deliveredAt: new Date().toISOString(),
            method: "email",
            items: order.items?.map((item: any) => ({
              product: item.product?.nameAr || "منتج",
              deliveryDetails: "تم إرسال التفاصيل عبر البريد الإلكتروني",
            })),
          },
        }),
      });

      // 4. Log delivery as evidence
      await createEvidenceLog({
        type: "delivery",
        order: orderId,
        customer: customerId,
        timestamp: new Date().toISOString(),
        ipAddress: "system",
        userAgent: "auto-delivery",
        data: {
          deliveredAt: new Date().toISOString(),
          method: "email",
          status: "sent",
        },
      });

      // 5. Send confirmation email
      if (order.customer?.email) {
        const emailResult = await sendOrderConfirmationEmail({
          customerName: order.customer.name || "عميل",
          customerEmail: order.customer.email,
          orderNumber: order.orderNumber,
          items: order.items?.map((item: any) => ({
            name: item.product?.nameAr || item.product?.name?.ar || "منتج",
            quantity: item.quantity,
            price: item.totalPrice,
          })) || [],
          totalAmount: order.totalAmount,
          currency: order.currency,
          deliveryDetails: "تم إرسال تفاصيل المنتج إلى بريدك الإلكتروني.",
        });

        // Log email delivery as evidence
        await createEvidenceLog({
          type: "delivery",
          order: orderId,
          customer: customerId,
          timestamp: new Date().toISOString(),
          ipAddress: "system",
          userAgent: "resend-email",
          data: {
            emailSent: emailResult.success,
            messageId: emailResult.messageId,
            error: emailResult.error,
            to: order.customer.email,
          },
        });
      }
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error("Webhook error:", error);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 }
    );
  }
}
