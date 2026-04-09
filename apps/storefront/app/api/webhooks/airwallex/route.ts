import { NextRequest, NextResponse } from 'next/server'
import { verifyWebhookSignature } from '@/lib/airwallex'
import { payloadInternalPatch, payloadInternalPost } from '@/lib/payload'
import { logEvidence } from '@/lib/evidence'
import { sendOrderConfirmationEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  const rawBody = await request.text()
  const signature = request.headers.get('x-airwallex-signature') || ''
  const webhookSecret = process.env.AIRWALLEX_WEBHOOK_SECRET || ''

  // Verify webhook signature
  if (webhookSecret && !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error('[Webhook/Airwallex] Invalid signature')
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
  }

  let event: any
  try {
    event = JSON.parse(rawBody)
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  console.log('[Webhook/Airwallex] Event received:', event.name, event.data?.object?.id)

  // Handle successful payment
  if (event.name === 'payment_intent.succeeded') {
    const intent = event.data?.object
    const orderId = intent?.metadata?.orderId

    if (!orderId) {
      console.error('[Webhook/Airwallex] No orderId in intent metadata')
      return NextResponse.json({ received: true })
    }

    try {
      // 1. Update order status to paid
      await payloadInternalPatch(`/orders/${orderId}`, {
        status: 'paid',
        paymentReference: intent.id,
        deliveryStatus: 'pending',
      })

      // 2. Log payment evidence
      await logEvidence({
        orderId,
        type: 'payment',
        data: {
          paymentIntentId: intent.id,
          amount: intent.amount,
          currency: intent.currency,
          paymentMethod: intent.payment_method_type,
          paidAt: new Date().toISOString(),
        },
      })

      // 3. Trigger digital delivery
      await deliverOrder(orderId, intent)

    } catch (err) {
      console.error('[Webhook/Airwallex] Processing error:', err)
      // Return 200 to prevent Airwallex retries for business logic errors
    }
  }

  if (event.name === 'payment_intent.payment_failed') {
    const intent = event.data?.object
    const orderId = intent?.metadata?.orderId
    if (orderId) {
      await payloadInternalPatch(`/orders/${orderId}`, {
        status: 'cancelled',
      }).catch(console.error)
    }
  }

  return NextResponse.json({ received: true })
}

async function deliverOrder(orderId: string, intent: any) {
  try {
    // Fetch order details
    const orderRes = await fetch(
      `${process.env.PAYLOAD_API_URL}/api/orders/${orderId}?depth=3`,
      {
        headers: {
          Authorization: `users API-Key ${process.env.PAYLOAD_SECRET_KEY}`,
        },
      },
    )
    const order = await orderRes.json()

    // Update order to delivered
    await payloadInternalPatch(`/orders/${orderId}`, {
      status: 'delivered',
      deliveryStatus: 'delivered',
      deliveredAt: new Date().toISOString(),
    })

    // Log delivery evidence
    await logEvidence({
      orderId,
      type: 'delivery',
      data: {
        deliveredAt: new Date().toISOString(),
        itemCount: order.items?.length,
      },
    })

    // Send confirmation email
    if (order.customer?.email) {
      await sendOrderConfirmationEmail({
        to: order.customer.email,
        customerName: order.customer.name || 'عميل',
        orderNumber: order.orderNumber,
        items: order.items?.map((item: any) => ({
          name: item.product?.name_ar || 'منتج',
          quantity: item.quantity,
          price: item.price,
          currency: item.currency,
          deliveryData: item.deliveryData,
        })) || [],
        totalAmount: order.totalAmount,
        currency: order.currency,
        orderUrl: `${process.env.NEXTAUTH_URL}/orders/${orderId}`,
      })

      // Log email delivery evidence
      await logEvidence({
        orderId,
        customerId: order.customer?.id,
        type: 'delivery',
        data: {
          channel: 'email',
          emailSentTo: order.customer.email,
          sentAt: new Date().toISOString(),
        },
        internalNote: 'تم إرسال بريد تأكيد الطلب',
      })
    }
  } catch (err) {
    console.error('[deliverOrder] Error:', err)
    await payloadInternalPatch(`/orders/${orderId}`, {
      deliveryStatus: 'failed',
    }).catch(() => {})
  }
}
