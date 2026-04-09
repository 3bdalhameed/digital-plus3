import type { Metadata } from 'next'
import { Lock } from 'lucide-react'

export const metadata: Metadata = { title: 'سياسة الخصوصية' }

export default function PrivacyPage() {
  return (
    <div>
      <div className="flex items-center gap-3 mb-8">
        <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h1 className="text-3xl font-black text-primary-dark">سياسة الخصوصية</h1>
      </div>
      <div className="card-purple p-8 space-y-6 text-gray-700">
        <section>
          <h2 className="text-xl font-bold text-primary-dark mb-3">البيانات التي نجمعها</h2>
          <p className="text-sm leading-relaxed">
            نجمع البيانات الضرورية لإتمام معاملاتك: الاسم، البريد الإلكتروني، معلومات الدفع (عبر بوابة آمنة)،
            وعنوان IP للحماية من الاحتيال وتوثيق المعاملات.
          </p>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary-dark mb-3">كيف نستخدم بياناتك</h2>
          <ul className="text-sm space-y-1">
            <li>• معالجة الطلبات وتسليم المنتجات</li>
            <li>• إرسال تأكيدات الطلبات عبر البريد الإلكتروني</li>
            <li>• الحماية من الاحتيال وتوثيق المعاملات لحمايتك</li>
            <li>• تحسين خدماتنا</li>
          </ul>
        </section>
        <section>
          <h2 className="text-xl font-bold text-primary-dark mb-3">سجلات الأدلة</h2>
          <p className="text-sm leading-relaxed">
            نحتفظ بسجلات الدفع والتسليم لحماية حقوقك في حال نشأ أي نزاع.
            هذه السجلات تشمل توقيت قبول الشروط، إتمام الدفع، وتأكيد الاستخدام.
          </p>
        </section>
      </div>
    </div>
  )
}
