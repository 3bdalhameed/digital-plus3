// Airwallex Payment Integration
// Docs: https://www.airwallex.com/docs/payments__payment-elements

const AIRWALLEX_API_BASE =
  process.env.AIRWALLEX_ENV === "production"
    ? "https://api.airwallex.com"
    : "https://api-demo.airwallex.com";

interface AirwallexAuthResponse {
  token: string;
  expires_at: string;
}

interface PaymentIntentRequest {
  amount: number;
  currency: string;
  merchant_order_id: string;
  metadata?: Record<string, string>;
  order: {
    products: {
      name: string;
      quantity: number;
      unit_price: number;
    }[];
  };
}

interface PaymentIntent {
  id: string;
  client_secret: string;
  status: string;
  amount: number;
  currency: string;
}

// ---------------------
// Authentication
// ---------------------

let cachedToken: { token: string; expiresAt: Date } | null = null;

async function getAuthToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > new Date()) {
    return cachedToken.token;
  }

  const res = await fetch(`${AIRWALLEX_API_BASE}/api/v1/authentication/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-client-id": process.env.AIRWALLEX_CLIENT_ID!,
      "x-api-key": process.env.AIRWALLEX_API_KEY!,
    },
  });

  if (!res.ok) {
    throw new Error(`Airwallex auth failed: ${res.status}`);
  }

  const data: AirwallexAuthResponse = await res.json();
  cachedToken = {
    token: data.token,
    expiresAt: new Date(data.expires_at),
  };

  return data.token;
}

// ---------------------
// Payment Intents
// ---------------------

export async function createPaymentIntent(
  params: PaymentIntentRequest
): Promise<PaymentIntent> {
  const token = await getAuthToken();

  const res = await fetch(
    `${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/create`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`,
        amount: params.amount,
        currency: params.currency,
        merchant_order_id: params.merchant_order_id,
        metadata: params.metadata || {},
        order: params.order,
      }),
    }
  );

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(
      `Airwallex create intent failed: ${res.status} — ${errorBody}`
    );
  }

  return res.json();
}

export async function getPaymentIntent(intentId: string): Promise<PaymentIntent> {
  const token = await getAuthToken();

  const res = await fetch(
    `${AIRWALLEX_API_BASE}/api/v1/pa/payment_intents/${intentId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }
  );

  if (!res.ok) {
    throw new Error(`Airwallex get intent failed: ${res.status}`);
  }

  return res.json();
}

// ---------------------
// Webhook Verification
// ---------------------

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  timestamp: string
): boolean {
  const crypto = require("crypto");
  const secret = process.env.AIRWALLEX_WEBHOOK_SECRET!;

  const signedPayload = `${timestamp}.${payload}`;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(signedPayload)
    .digest("hex");

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
}
