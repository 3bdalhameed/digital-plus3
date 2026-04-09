'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Loader2 } from 'lucide-react'

declare global {
  interface Window {
    AirwallexPaymentElements?: any
  }
}

interface AirwallexPaymentProps {
  clientSecret: string
  intentId: string
  onSuccess: (paymentIntentId: string) => void
  onError: (error: string) => void
  amount: number
  currency: string
}

function loadAirwallexSDK(): Promise<any> {
  return new Promise((resolve, reject) => {
    if (window.AirwallexPaymentElements) {
      resolve(window.AirwallexPaymentElements)
      return
    }
    const script = document.createElement('script')
    script.src =
      process.env.NODE_ENV === 'production'
        ? 'https://checkout.airwallex.com/assets/elements.bundle.min.js'
        : 'https://checkout-demo.airwallex.com/assets/elements.bundle.min.js'
    script.onload = () => resolve(window.AirwallexPaymentElements)
    script.onerror = () => reject(new Error('Failed to load Airwallex SDK'))
    document.head.appendChild(script)
  })
}

export function AirwallexPayment({
  clientSecret,
  intentId,
  onSuccess,
  onError,
  amount,
  currency,
}: AirwallexPaymentProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [loading, setLoading] = useState(true)
  const [paying, setPaying] = useState(false)
  const elementRef = useRef<any>(null)
  const airwallexRef = useRef<any>(null)

  useEffect(() => {
    let mounted = true

    async function initAirwallex() {
      try {
        const Airwallex = await loadAirwallexSDK()
        airwallexRef.current = Airwallex

        await Airwallex.loadAirwallex({
          env: process.env.NODE_ENV === 'production' ? 'prod' : 'demo',
          origin: window.location.origin,
        })

        if (!mounted || !containerRef.current) return

        const element = Airwallex.createElement('card', {
          style: {
            base: {
              fontFamily: 'Cairo, sans-serif',
              fontSize: '16px',
              color: '#374151',
            },
          },
        })

        elementRef.current = element
        element.mount(containerRef.current)
        element.on('ready', () => setLoading(false))
        element.on('error', (e: any) => onError(e.message || 'خطأ في نظام الدفع'))
        setLoading(false)
      } catch (err) {
        console.error('Airwallex init error:', err)
        onError('فشل تحميل نظام الدفع')
        setLoading(false)
      }
    }

    initAirwallex()
    return () => {
      mounted = false
      elementRef.current?.destroy?.()
    }
  }, [clientSecret])

  const handlePay = async () => {
    if (!elementRef.current || !airwallexRef.current) return
    setPaying(true)

    try {
      const result = await airwallexRef.current.confirmPaymentIntent({
        element: elementRef.current,
        id: intentId,
        client_secret: clientSecret,
      })

      if (result.status === 'SUCCEEDED') {
        onSuccess(result.id)
      } else {
        onError(`فشل الدفع: ${result.status}`)
      }
    } catch (err: any) {
      onError(err.message || 'فشل الدفع')
    } finally {
      setPaying(false)
    }
  }

  return (
    <div className="space-y-4">
      {loading && (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="mr-2 text-gray-500">جاري تحميل نظام الدفع...</span>
        </div>
      )}
      <div
        ref={containerRef}
        className="border-2 border-purple-200 rounded-xl p-4 min-h-[120px]"
        style={{ display: loading ? 'none' : 'block' }}
      />
      {!loading && (
        <Button
          className="w-full"
          size="lg"
          onClick={handlePay}
          disabled={paying}
        >
          {paying ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin ml-2" />
              جاري معالجة الدفع...
            </>
          ) : (
            `ادفع ${amount.toFixed(2)} ${currency}`
          )}
        </Button>
      )}
    </div>
  )
}
