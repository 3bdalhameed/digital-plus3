import Link from 'next/link'
import { CheckCircle2, Package, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface SearchParams {
  orderId?: string
  ref?: string
}

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-20 text-center">
      <div className="card-purple p-10">
        {/* Success icon */}
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle2 className="h-14 w-14 text-green-500" />
        </div>

        <h1 className="text-3xl font-black text-primary-dark mb-3">
          تم تأكيد طلبك بنجاح! 🎉
        </h1>
        <p className="text-gray-500 mb-6">
          شكراً لك على شرائك. سيتم إرسال تفاصيل التسليم إلى بريدك الإلكتروني.
        </p>

        {searchParams.orderId && (
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-gray-500">رقم الطلب</p>
            <p className="font-mono font-bold text-primary text-lg">
              {searchParams.orderId}
            </p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {searchParams.orderId && (
            <Link href={`/orders/${searchParams.orderId}`}>
              <Button className="gap-2">
                <Package className="h-4 w-4" />
                عرض تفاصيل الطلب
              </Button>
            </Link>
          )}
          <Link href="/products">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              متابعة التسوق
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
