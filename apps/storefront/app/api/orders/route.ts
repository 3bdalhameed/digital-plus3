import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getOrdersByCustomer } from '@/lib/payload'

export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.payloadCustomerId) {
    return NextResponse.json({ error: 'غير مصرح' }, { status: 401 })
  }

  const orders = await getOrdersByCustomer(session.user.payloadCustomerId).catch(
    () => ({ docs: [] }),
  )
  return NextResponse.json(orders)
}
