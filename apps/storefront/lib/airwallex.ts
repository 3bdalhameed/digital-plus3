/**
 * Airwallex payment integration
 * Handles payment intent creation and token refresh
 */

const AIRWALLEX_BASE_URL = 'https://pci-api.airwallex.com/api/v1'

let cachedToken: { token: string; expiresAt: number } | null = null

async function getAuthToken(): Promise<string> {
  // Return cached token if still valid (with 60s buffer)
  if (cachedToken && Date.now() < cachedToken.expiresAt - 60_000) {
    return cachedToken.token
  }

  const res = await fetch(`${AIRWALLEX_BASE_URL}/authentication/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-client-id': process.env.AIRWALLEX_CLIENT_ID || '',
      'x-api-key': process.env.AIRWALLEX_API_KEY || '',
    },
    cache: 'no-store',
  })

  if (!res.ok) {
    throw new Error(`Airwallex auth failed: ${res.status}`)
  }

  const data = await res.json()
  cachedToken = {
    token: data.token,
    expiresAt: Date.now() + data.expires_in * 1000,
  }

  return cachedToken.token
}

export interface CreatePaymentIntentParams {
  amount: number
  currency: string
  orderId: string
  customerEmail: string
  customerName: string
  descriptor?: string
}

export async function createPaymentIntent(params: CreatePaymentIntentParams) {
  const token = await getAuthToken()

  const res = await fetch(`${AIRWALLEX_BASE_URL}/pa/payment_intents/create`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      request_id: `${params.orderId}-${Date.now()}`,
      amount: params.amount,
      currency: params.currency,
      merchant_order_id: params.orderId,
      descriptor: params.descriptor || 'متجري - Digital Products',
      customer: {
        email: params.customerEmail,
        name: params.customerName,
      },
      return_url: `${process.env.NEXTAUTH_URL}/checkout/success`,
      metadata: {
        orderId: params.orderId,
      },
    }),
    cache: 'no-store',
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Airwallex create intent failed: ${res.status} ${text}`)
  }

  return res.json()
}

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string,
): boolean {
  const crypto = require('crypto')
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSig),
  )
}
