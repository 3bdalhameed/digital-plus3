import { NextRequest, NextResponse } from 'next/server'
import { createPaymentIntent } from '@/lib/airwallex'
import { payloadInternalPost } from '@/lib/payload'
import { auth } from '@/lib/auth'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      amount,
      currency,
      items,
      customerEmail,
      customerName,
    } = body

    if (!amount || !currency || !items?.length) {
      return NextResponse.json(
        { error: 'البيانات المطلوبة غير مكتملة' },
        { status: 400 },
      )
    }

    const session = await auth()

    // Create a pending order in Payload CMS first
    const orderData = await payloadInternalPost('/orders', {
      status: 'pending',
      items: items.map((item: any) => ({
        product: item.productId,
        quantity: item.quantity,
        price: item.price,
        currency: item.currency,
      })),
      totalAmount: amount,
      currency,
      ...(session?.user?.payloadCustomerId && {
        customer: session.user.payloadCustomerId,
      }),
    })

    const orderId = orderData.doc?.id || orderData.id

    // Create Airwallex payment intent
    const intent = await createPaymentIntent({
      amount,
      currency,
      orderId,
      customerEmail: customerEmail || session?.user?.email || 'guest@example.com',
      customerName: customerName || session?.user?.name || 'Guest',
    })

    // Store intentId on the order
    await payloadInternalPatch(`/orders/${orderId}`, {
      airwallexPaymentIntentId: intent.id,
    })

    return NextResponse.json({
      clientSecret: intent.client_secret,
      intentId: intent.id,
      orderId,
    })
  } catch (err: any) {
    console.error('[API/airwallex/create-intent]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
