import type { Metadata } from 'next'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getOrdersByCustomer } from '@/lib/payload'
import { Badge } from '@/components/ui/badge'
import { formatPrice } from '@/lib/utils'
import { Package } from 'lucide-react'

export const metadata: Metadata = { title: 'طلباتي' }

const statusMap: Record<string, { label: string; variant: any }> = {
  pending: { label: 'في الانتظار', variant: 'warning' },
  paid: { label: 'مدفوع', variant: 'secondary' },
  delivered: { label: 'تم التسليم', variant: 'success' },
  disputed: { label: 'متنازع عليه', variant: 'destructive' },
  refunded: { label: 'مسترجع', variant: 'outline' },
  cancelled: { label: 'ملغي', variant: 'outline' },
}

export default async function OrdersPage() {
  const session = await auth()
  const customerId = session?.user?.payloadCustomerId

  const ordersData = customerId
    ? await getOrdersByCustomer(customerId).catch(() => ({ docs: [] }))
    : { docs: [] }

  const orders = (ordersData as any).docs || []

  return (
    <div>
      <h1 className="text-2xl font-black text-primary-dark mb-6">طلباتي</h1>

      {orders.length === 0 ? (
        <div className="card-purple p-16 text-center">
          <Package className="h-16 w-16 text-purple-200 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-500 mb-2">لا توجد طلبات بعد</h3>
          <p className="text-gray-400">طلباتك ستظهر هنا بعد إتمام عملية الشراء</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => {
            const status = statusMap[order.status] || { label: order.status, variant: 'outline' }
            return (
              <Link
                key={order.id}
                href={`/orders/${order.id}`}
                className="card-purple p-5 flex items-center justify-between hover:shadow-md transition-shadow block"
              >
                <div>
                  <p className="font-mono text-sm text-gray-400">{order.orderNumber}</p>
                  <p className="font-bold text-primary-dark mt-1">
                    {order.items?.length} منتج
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    {new Date(order.createdAt).toLocaleDateString('ar-SA')}
                  </p>
                </div>
                <div className="text-left">
                  <Badge variant={status.variant} className="mb-2">
                    {status.label}
                  </Badge>
                  <p className="font-extrabold text-primary">
                    {formatPrice(order.totalAmount, order.currency)}
                  </p>
                </div>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
