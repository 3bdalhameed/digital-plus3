import type { Metadata } from 'next'
import { getPoliciesContent } from '@/lib/payload'
import { RefreshCw } from 'lucide-react'

export const metadata: Metadata = { title: 'سياسة الاسترجاع' }

export default async function RefundPage() {
  const policies = await getPoliciesContent().catch(() => null) as any

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
          <RefreshCw className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-primary-dark">سياسة الاسترجاع</h1>
      </div>
      <div className="card-purple p-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4 mb-6">
          <p className="text-yellow-800 font-medium text-sm">
            ⚠️ مهم: نظراً لطبيعة المنتجات الرقمية، لا يمكن الاسترجاع بعد التسليم والاستخدام.
          </p>
        </div>
        {policies?.refundPolicy ? (
          <div className="prose prose-purple max-w-none text-gray-700">
            <p>يرجى مراجعة لوحة التحكم لإدخال محتوى سياسة الاسترجاع.</p>
          </div>
        ) : (
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">متى يمكن طلب الاسترجاع؟</h2>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  في حالة عدم تسليم المنتج بعد إتمام الدفع
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-green-500 mt-0.5">✓</span>
                  في حالة وجود عطل موثق في المنتج يمنع استخدامه
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  لا يمكن الاسترجاع بعد فتح مفتاح الترخيص أو استخدام الدعوة
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-500 mt-0.5">✗</span>
                  لا يمكن الاسترجاع إذا كان المنتج يعمل كما هو مُعلَن
                </li>
              </ul>
            </section>
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">كيفية تقديم طلب الاسترجاع</h2>
              <p className="text-sm leading-relaxed">
                يمكنك التواصل مع فريق الدعم خلال 24 ساعة من الشراء عبر صفحة الدعم الفني.
                يجب تقديم دليل على المشكلة (لقطة شاشة أو وصف تفصيلي).
              </p>
            </section>
          </div>
        )}
      </div>
    </div>
  )
}
