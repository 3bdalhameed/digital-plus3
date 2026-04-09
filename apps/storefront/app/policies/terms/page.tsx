import type { Metadata } from 'next'
import { getPoliciesContent } from '@/lib/payload'
import { Shield } from 'lucide-react'

export const metadata: Metadata = { title: 'الشروط والأحكام' }

export default async function TermsPage() {
  const policies = await getPoliciesContent().catch(() => null) as any

  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
          <Shield className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-primary-dark">الشروط والأحكام</h1>
      </div>
      <div className="card-purple p-8">
        {policies?.termsAndConditions ? (
          <div className="prose prose-purple max-w-none text-gray-700 leading-relaxed">
            {/* Rich text rendered here */}
            <p>يرجى مراجعة لوحة التحكم لإدخال محتوى الشروط والأحكام.</p>
          </div>
        ) : (
          <div className="space-y-6 text-gray-700">
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">1. قبول الشروط</h2>
              <p className="leading-relaxed">
                باستخدامك لهذا الموقع أو شرائك أي منتج منه، فإنك توافق على الالتزام بهذه الشروط والأحكام.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">2. المنتجات الرقمية</h2>
              <p className="leading-relaxed">
                جميع المنتجات المباعة هي منتجات رقمية (اشتراكات، مفاتيح ترخيص، بطاقات رقمية).
                يتم التسليم فور إتمام الدفع إما عبر البريد الإلكتروني أو مباشرة داخل المنصة.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">3. الدفع</h2>
              <p className="leading-relaxed">
                جميع المدفوعات تتم عبر بوابة دفع آمنة ومشفرة. الأسعار المعروضة تشمل جميع الرسوم المطبقة.
              </p>
            </section>
            <section>
              <h2 className="text-xl font-bold text-primary-dark mb-3">4. الاستخدام المسموح</h2>
              <p className="leading-relaxed">
                المنتجات المشتراة للاستخدام الشخصي فقط. يُحظر إعادة البيع أو التوزيع دون إذن مسبق.
              </p>
            </section>
          </div>
        )}
        <p className="text-xs text-gray-400 mt-8 pt-4 border-t border-purple-100">
          آخر تحديث: {new Date().toLocaleDateString('ar-SA')}
        </p>
      </div>
    </div>
  )
}
