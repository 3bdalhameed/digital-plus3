'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Shield, FileText } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AirwallexPayment } from '@/components/checkout/AirwallexPayment'
import { useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

type CheckoutStep = 'details' | 'payment'

export default function CheckoutPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const { items, total, clearCart } = useCartStore()
  const [step, setStep] = useState<CheckoutStep>('details')
  const [termsAccepted, setTermsAccepted] = useState(false)
  const [refundAccepted, setRefundAccepted] = useState(false)
  const [paymentData, setPaymentData] = useState<{
    clientSecret: string
    intentId: string
    orderId: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const cartTotal = total()
  const currency = items[0]?.currency || 'USD'

  if (items.length === 0) {
    router.push('/cart')
    return null
  }

  const handleProceedToPayment = async () => {
    if (!termsAccepted || !refundAccepted) {
      setError('يجب الموافقة على الشروط والأحكام وسياسة الاسترجاع للمتابعة')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Log terms acceptance evidence
      await fetch('/api/evidence/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'terms_acceptance',
          data: {
            termsAccepted: true,
            refundPolicyAccepted: true,
            items: items.map((i) => ({ productId: i.productId, name: i.name })),
          },
        }),
      })

      // Create payment intent
      const res = await fetch('/api/airwallex/create-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: cartTotal,
          currency,
          items: items.map((i) => ({
            productId: i.productId,
            name: i.name,
            quantity: i.quantity,
            price: i.price,
            currency: i.currency,
          })),
          customerEmail: session?.user?.email || '',
          customerName: session?.user?.name || 'Guest',
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل إنشاء طلب الدفع')
      }

      const data = await res.json()
      setPaymentData({
        clientSecret: data.clientSecret,
        intentId: data.intentId,
        orderId: data.orderId,
      })
      setStep('payment')
    } catch (err: any) {
      setError(err.message || 'حدث خطأ، يرجى المحاولة مجدداً')
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    clearCart()
    router.push(`/checkout/success?orderId=${paymentData?.orderId}&ref=${paymentIntentId}`)
  }

  const handlePaymentError = (err: string) => {
    setError(err)
    setStep('details')
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-primary-dark mb-8">إتمام الطلب</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Main area */}
        <div className="md:col-span-2 space-y-6">
          {step === 'details' && (
            <>
              {/* Guest warning */}
              {!session && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 text-sm text-yellow-800">
                  <p className="font-medium mb-1">أنت تتسوق كضيف</p>
                  <p>
                    <Link href="/auth/login" className="underline font-medium">
                      سجّل دخولك
                    </Link>{' '}
                    لتتمكن من متابعة طلباتك لاحقاً
                  </p>
                </div>
              )}

              {/* Terms acceptance — REQUIRED for evidence logging */}
              <div className="card-purple p-6 space-y-4">
                <div className="flex items-start gap-3">
                  <Shield className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                  <h2 className="font-bold text-primary-dark text-lg">
                    الموافقة على الشروط والسياسات
                  </h2>
                </div>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-primary"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary-dark transition-colors">
                    أوافق على{' '}
                    <Link
                      href="/policies/terms"
                      target="_blank"
                      className="text-primary underline font-medium"
                    >
                      الشروط والأحكام
                    </Link>{' '}
                    وأفهم أن المنتجات الرقمية تُسلَّم فور الدفع
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={refundAccepted}
                    onChange={(e) => setRefundAccepted(e.target.checked)}
                    className="mt-1 w-5 h-5 accent-primary"
                  />
                  <span className="text-sm text-gray-700 group-hover:text-primary-dark transition-colors">
                    قرأت وفهمت{' '}
                    <Link
                      href="/policies/refund"
                      target="_blank"
                      className="text-primary underline font-medium"
                    >
                      سياسة الاسترجاع
                    </Link>{' '}
                    وأعلم أن المنتجات الرقمية غير قابلة للاسترجاع بعد الاستلام
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
                  {error}
                </div>
              )}

              <Button
                className="w-full"
                size="lg"
                onClick={handleProceedToPayment}
                disabled={loading || !termsAccepted || !refundAccepted}
              >
                {loading ? 'جاري التجهيز...' : 'المتابعة للدفع الآمن'}
              </Button>
            </>
          )}

          {step === 'payment' && paymentData && (
            <div className="card-purple p-6">
              <h2 className="font-bold text-primary-dark text-lg mb-4 flex items-center gap-2">
                <Shield className="h-5 w-5 text-green-500" />
                الدفع الآمن
              </h2>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 mb-4">
                  {error}
                </div>
              )}
              <AirwallexPayment
                clientSecret={paymentData.clientSecret}
                intentId={paymentData.intentId}
                amount={cartTotal}
                currency={currency}
                onSuccess={handlePaymentSuccess}
                onError={handlePaymentError}
              />
            </div>
          )}
        </div>

        {/* Order summary */}
        <div>
          <div className="card-purple p-5 sticky top-24">
            <h3 className="font-bold text-primary-dark mb-4">ملخص الطلب</h3>
            <div className="space-y-2 mb-4">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm">
                  <span className="text-gray-600 truncate max-w-[60%]">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="text-primary-dark font-medium">
                    {formatPrice(item.price * item.quantity, item.currency)}
                  </span>
                </div>
              ))}
            </div>
            <div className="border-t border-purple-100 pt-3 flex justify-between font-extrabold">
              <span className="text-primary-dark">الإجمالي</span>
              <span className="text-primary text-lg">
                {formatPrice(cartTotal, currency)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
