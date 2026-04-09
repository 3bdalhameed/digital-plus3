import type { Metadata } from 'next'
import { Navbar } from '@/components/layout/Navbar'
import { Footer } from '@/components/layout/Footer'
import { getSettings } from '@/lib/payload'
import { Shield, Zap, Headphones, Star } from 'lucide-react'

export const metadata: Metadata = { title: 'عن المتجر' }

const features = [
  { icon: Zap, title: 'تسليم فوري', desc: 'استلم منتجاتك الرقمية فور إتمام الدفع' },
  { icon: Shield, title: 'دفع آمن', desc: 'تشفير كامل لجميع معاملاتك المالية' },
  { icon: Headphones, title: 'دعم 24/7', desc: 'فريق متخصص لمساعدتك في أي وقت' },
  { icon: Star, title: 'منتجات أصلية', desc: 'جميع منتجاتنا أصلية ومضمونة' },
]

export default async function AboutPage() {
  const settings = await getSettings().catch(() => null) as any

  return (
    <div className="flex flex-col min-h-screen">
      <Navbar />
      <main className="flex-1">
        <div className="gradient-header text-white py-20 text-center">
          <h1 className="text-4xl font-black mb-4">عن {settings?.siteName || 'متجرنا'}</h1>
          <p className="text-purple-200 text-lg max-w-2xl mx-auto">
            متجر متخصص في المنتجات الرقمية — اشتراكات برمجية، مفاتيح ترخيص، بطاقات ألعاب وأكثر
          </p>
        </div>
        <div className="max-w-5xl mx-auto px-4 py-16">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
            {features.map((f, i) => (
              <div key={i} className="card-purple p-6 text-center">
                <div className="w-12 h-12 bg-primary-light rounded-xl flex items-center justify-center mx-auto mb-4">
                  <f.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-bold text-primary-dark mb-2">{f.title}</h3>
                <p className="text-gray-500 text-sm">{f.desc}</p>
              </div>
            ))}
          </div>
          {settings?.contactEmail && (
            <div className="card-purple p-8 text-center">
              <h2 className="text-2xl font-black text-primary-dark mb-4">تواصل معنا</h2>
              <div className="space-y-2 text-gray-600">
                <p>البريد الإلكتروني: <a href={`mailto:${settings.contactEmail}`} className="text-primary hover:underline">{settings.contactEmail}</a></p>
                {settings.whatsappNumber && (
                  <p>واتساب: <a href={`https://wa.me/${settings.whatsappNumber.replace(/\D/g, '')}`} className="text-primary hover:underline">{settings.whatsappNumber}</a></p>
                )}
                {settings.supportHours && <p>ساعات الدعم: {settings.supportHours}</p>}
              </div>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  )
}
