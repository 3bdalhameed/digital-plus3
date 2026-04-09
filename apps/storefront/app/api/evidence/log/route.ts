import { NextRequest, NextResponse } from 'next/server'
import { logEvidence, getClientIP, parseUserAgent } from '@/lib/evidence'
import type { EvidenceType } from '@my-store/types'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      orderId,
      customerId,
      productId,
      type,
      sessionId,
      data,
      internalNote,
    } = body

    if (!type) {
      return NextResponse.json({ error: 'نوع السجل مطلوب' }, { status: 400 })
    }

    const ipAddress = getClientIP(request)
    const userAgent = request.headers.get('user-agent') || ''
    const { device, browser } = parseUserAgent(userAgent)

    await logEvidence({
      orderId,
      customerId,
      productId,
      type: type as EvidenceType,
      ipAddress,
      userAgent,
      device,
      browser,
      sessionId,
      data,
      internalNote,
    })

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('[API/evidence/log]', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
