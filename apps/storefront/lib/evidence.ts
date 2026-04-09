/**
 * Evidence logging utility
 * All important events are logged here for dispute protection
 */

import type { EvidenceType } from '@my-store/types'
import { payloadInternalPost } from './payload'

export interface LogEvidenceParams {
  orderId?: string
  customerId?: string
  productId?: string
  type: EvidenceType
  ipAddress?: string
  userAgent?: string
  sessionId?: string
  device?: string
  browser?: string
  data?: Record<string, any>
  internalNote?: string
}

export async function logEvidence(params: LogEvidenceParams): Promise<void> {
  try {
    await payloadInternalPost('/evidence-logs', {
      ...params,
      timestamp: new Date().toISOString(),
    })
  } catch (err) {
    // Evidence logging should never crash the main flow
    console.error('[EvidenceLog] Failed to log evidence:', err)
  }
}

/**
 * Extract device/browser info from userAgent string
 */
export function parseUserAgent(ua: string): { device: string; browser: string } {
  const isMobile = /Mobile|Android|iPhone|iPad/.test(ua)
  const isTablet = /iPad|Tablet/.test(ua)

  let device = 'Desktop'
  if (isTablet) device = 'Tablet'
  else if (isMobile) device = 'Mobile'

  let browser = 'Unknown'
  if (ua.includes('Chrome') && !ua.includes('Edg')) browser = 'Chrome'
  else if (ua.includes('Firefox')) browser = 'Firefox'
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari'
  else if (ua.includes('Edg')) browser = 'Edge'
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera'

  return { device, browser }
}

/**
 * Get client IP from Next.js request headers
 */
export function getClientIP(request: Request): string {
  return (
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-real-ip') ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    '0.0.0.0'
  )
}
