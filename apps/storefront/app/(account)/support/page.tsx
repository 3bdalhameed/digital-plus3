'use client'

import { useState } from 'react'
import { Headphones, Send, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useSession } from 'next-auth/react'

export default function SupportPage() {
  const { data: session } = useSession()
  const [subject, setSubject] = useState('')
  const [message, setMessage] = useState('')
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3001'}/api/support-tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: session?.user?.payloadCustomerId,
          ...(orderId && { order: orderId }),
          channel: 'platform',
          messages: [
            {
              sender: 'customer',
              text: `${subject}\n\n${message}`,
              timestamp: new Date().toISOString(),
            },
          ],
        }),
      })

      if (!res.ok) throw new Error('فشل إرسال التذكرة')
      setSent(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="max-w-2xl mx-auto text-center py-16">
        <div className="text-6xl mb-4">✅</div>
        <h2 className="text-2xl font-black text-primary-dark mb-2">تم إرسال طلب الدعم</h2>
        <p className="text-gray-500">سيتواصل معك فريق الدعم في أقرب وقت</p>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary-light rounded-xl flex items-center justify-center">
          <Headphones className="h-5 w-5 text-primary" />
        </div>
        <h1 className="text-2xl font-black text-primary-dark">الدعم الفني</h1>
      </div>

      <div className="card-purple p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              رقم الطلب (اختياري)
            </label>
            <input
              type="text"
              value={orderId}
              onChange={(e) => setOrderId(e.target.value)}
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder="ORD-XXXXXXXX-XXXX"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              موضوع المشكلة *
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none"
              placeholder="اكتب موضوع مشكلتك"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              تفاصيل المشكلة *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
              rows={5}
              className="w-full border-2 border-purple-200 rounded-xl px-4 py-3 text-sm focus:border-primary focus:outline-none resize-none"
              placeholder="اشرح مشكلتك بالتفصيل..."
            />
          </div>
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-sm text-red-600">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full gap-2" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            إرسال طلب الدعم
          </Button>
        </form>
      </div>
    </div>
  )
}
