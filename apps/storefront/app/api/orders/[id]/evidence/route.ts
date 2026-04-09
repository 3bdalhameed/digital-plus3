import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'

const PAYLOAD_URL = process.env.PAYLOAD_API_URL || 'http://localhost:3001'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const session = await auth()
  if (!session) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  try {
    const [orderRes, evidenceRes] = await Promise.all([
      fetch(`${PAYLOAD_URL}/api/orders/${params.id}?depth=2`, {
        headers: { Authorization: `users API-Key ${process.env.PAYLOAD_SECRET_KEY}` },
      }),
      fetch(
        `${PAYLOAD_URL}/api/evidence-logs?where[order][equals]=${params.id}&sort=-timestamp&depth=1&limit=100`,
        {
          headers: { Authorization: `users API-Key ${process.env.PAYLOAD_SECRET_KEY}` },
        },
      ),
    ])

    const [order, evidence] = await Promise.all([
      orderRes.json(),
      evidenceRes.json(),
    ])

    return NextResponse.json({
      order,
      evidence: evidence.docs || [],
      summary: {
        termsAcceptance: evidence.docs?.find((e: any) => e.type === 'terms_acceptance'),
        payment: evidence.docs?.find((e: any) => e.type === 'payment'),
        delivery: evidence.docs?.find((e: any) => e.type === 'delivery'),
        usageConfirmation: evidence.docs?.find((e: any) => e.type === 'usage_confirmation'),
        totalEvents: evidence.docs?.length || 0,
      },
    })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
