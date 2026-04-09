import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { getOrderById } from '@/lib/payload'
import { Badge } from '@/components/ui/badge'
import { UsageConfirmButton } from '@/components/evidence/UsageConfirmButton'
import { formatPrice, getProductName } from '@/lib/utils'
import { Package, Clock, CheckCircle2 } from 'lucide-react'

export const metadata: Metadata = { title: 'تفاصيل الطلب' }

interface Props {
  params: { id: string }
}

const statusMap: Record<string, { label: string; variant: any }> = {
  pending: { label: 'في الانتظار', variant: 'warning' },
  paid: { label: 'مدفوع', variant: 'secondary' },
  delivered: { label: 'تم التسليم', variant: 'success' },
  disputed: { label: 'متنازع عليه', variant: 'destructive' },
  refunded: { label: 'مسترجع', variant: 'outline' },
  cancelled: { label: 'ملغي', variant: 'outline' },
}

export default async function OrderDetailPage({ params }: Props) {
  const session = await auth()
  const order = await getOrderById(params.id, '').catch(() => null) as any
  if (!order) notFound()

  const status = statusMap[order.status] || { label: order.status, variant: 'outline' }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <Link href="/orders" className="text-sm text-primary hover:underline mb-2 block">
            ← طلباتي
          </Link>
          <h1 className="text-2xl font-black text-primary-dark">تفاصيل الطلب</h1>
          <p className="font-mono text-gray-400">{order.orderNumber}</p>
        </div>
        <Badge variant={status.variant} className="text-sm px-3 py-1">
          {status.label}
        </Badge>
      </div>

      {/* Items */}
      <div className="card-purple p-6 mb-6">
        <h2 className="font-bold text-primary-dark mb-4">المنتجات المطلوبة</h2>
        <div className="space-y-4">
          {order.items?.map((item: any, i: number) => {
            const product = item.product
            const thumbnail = product?.images?.[0]?.image?.url

            return (
              <div key={i} className="flex items-center gap-4">
                <div className="w-14 h-14 relative bg-purple-50 rounded-xl overflow-hidden shrink-0">
                  {thumbnail ? (
                    <Image src={thumbnail} alt="" fill className="object-contain p-1" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="h-6 w-6 text-purple-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-bold text-primary-dark">
                    {product ? getProductName(product) : 'منتج'}
                  </p>
                  <p className="text-sm text-gray-400">الكمية: {item.quantity}</p>

                  {/* Delivery data (license keys, etc.) */}
                  {item.deliveryData && (
                    <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3">
                      <p className="text-xs text-green-600 font-medium mb-1 flex items-center gap-1">
                        <CheckCircle2 className="h-3 w-3" />
                        بيانات التسليم
                      </p>
                      {Object.entries(item.deliveryData).map(([k, v]) => (
                        <div key={k} className="text-sm">
                          <span className="text-gray-500">{k}: </span>
                          <code className="bg-white px-2 py-0.5 rounded border border-green-100 font-mono text-green-800 select-all">
                            {String(v)}
                          </code>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="text-left shrink-0">
                  <p className="font-extrabold text-primary">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </p>
                </div>
              </div>
            )
          })}
        </div>

        <div className="border-t border-purple-100 mt-4 pt-4 flex justify-between font-extrabold">
          <span className="text-primary-dark">الإجمالي</span>
          <span className="text-primary text-xl">
            {formatPrice(order.totalAmount, order.currency)}
          </span>
        </div>
      </div>

      {/* Dates */}
      <div className="card-purple p-5 mb-6">
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="flex items-center gap-2 text-gray-600">
            <Clock className="h-4 w-4 text-primary" />
            <div>
              <p className="text-xs text-gray-400">تاريخ الطلب</p>
              <p className="font-medium">
                {new Date(order.createdAt).toLocaleDateString('ar-SA', {
                  year: 'numeric', month: 'long', day: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </p>
            </div>
          </div>
          {order.deliveredAt && (
            <div className="flex items-center gap-2 text-gray-600">
              <CheckCircle2 className="h-4 w-4 text-green-500" />
              <div>
                <p className="text-xs text-gray-400">تاريخ التسليم</p>
                <p className="font-medium">
                  {new Date(order.deliveredAt).toLocaleDateString('ar-SA', {
                    year: 'numeric', month: 'long', day: 'numeric',
                  })}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Usage confirmation button */}
      {(order.status === 'delivered' || order.status === 'paid') && (
        <div className="card-purple p-6">
          <h3 className="font-bold text-primary-dark mb-2">تأكيد الاستلام والاستخدام</h3>
          <p className="text-sm text-gray-500 mb-4">
            بعد استخدام المنتج، يرجى تأكيد الاستلام للمساعدة في توثيق تجربتك
          </p>
          <UsageConfirmButton
            orderId={order.id}
            customerId={session?.user?.payloadCustomerId}
            items={order.items || []}
          />
        </div>
      )}

      {/* Support link */}
      <div className="text-center mt-6">
        <p className="text-sm text-gray-400">
          هل تواجه مشكلة؟{' '}
          <Link href="/support" className="text-primary hover:underline font-medium">
            تواصل مع الدعم الفني
          </Link>
        </p>
      </div>
    </div>
  )
}
