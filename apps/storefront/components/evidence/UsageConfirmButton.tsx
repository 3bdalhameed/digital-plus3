'use client'

import { useState } from 'react'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface UsageConfirmButtonProps {
  orderId: string
  customerId?: string
  items: any[]
}

export function UsageConfirmButton({
  orderId,
  customerId,
  items,
}: UsageConfirmButtonProps) {
  const [confirmed, setConfirmed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleConfirm = async () => {
    if (confirmed) return
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/usage-confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerId,
          productIds: items.map((i: any) =>
            typeof i.product === 'string' ? i.product : i.product?.id,
          ),
          sessionId: sessionStorage.getItem('sessionId') || Date.now().toString(),
          timestamp: new Date().toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'فشل تأكيد الاستخدام')
      }

      setConfirmed(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (confirmed) {
    return (
      <div className="flex items-center gap-2 text-green-600 font-medium">
        <CheckCircle2 className="h-5 w-5" />
        تم تأكيد الاستلام والاستخدام بنجاح
      </div>
    )
  }

  return (
    <div>
      <Button
        onClick={handleConfirm}
        disabled={loading}
        variant="secondary"
        className="gap-2"
      >
        {loading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <CheckCircle2 className="h-4 w-4" />
        )}
        تأكيد الاستلام والاستخدام
      </Button>
      {error && (
        <p className="text-sm text-red-500 mt-2">{error}</p>
      )}
    </div>
  )
}
