import { NextRequest, NextResponse } from 'next/server'
import { logEvidence, getClientIP, parseUserAgent } from '@/lib/evidence'
import { payloadInternalPatch } from '@/lib/payload'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { orderId, customerId, productIds, sessionId, timestamp } = body

    if (!orderId) {
      return NextResponse.json({ error: 'معرف الطلب مطلوب' }, { status: 400 })
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const { device, browser } = parseUserAgent(userAgent)

    // Log usage confirmation for each product
    await Promise.all(
      (productIds || ['']).map((productId: string) =>
        logEvidence({
          orderId,
          customerId,
          productId,
          type: 'usage_confirmation',
          ipAddress,
          userAgent,
          device,
          browser,
          sessionId,
          data: {
            confirmedAt: timestamp || new Date().toISOString(),
            productId,
          },
        }),
      ),
    )

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API/usage-confirm]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
