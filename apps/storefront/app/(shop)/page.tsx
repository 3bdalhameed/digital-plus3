import type { Metadata } from 'next'
import { getHomePage } from '@/lib/payload'
import { SectionRenderer } from '@/components/sections/SectionRenderer'

export const metadata: Metadata = {
  title: 'الرئيسية',
}

export default async function HomePage() {
  const homePage = await getHomePage().catch(() => null) as any

  return (
    <div>
      {homePage?.sections?.length ? (
        <SectionRenderer sections={homePage.sections} />
      ) : (
        // Fallback if no CMS content configured yet
        <div className="gradient-header min-h-[400px] flex items-center justify-center text-center px-4">
          <div>
            <h1 className="text-5xl font-black text-white mb-4">مرحباً بك في متجرنا</h1>
            <p className="text-purple-200 text-xl">اشتراكات برمجية • مفاتيح ترخيص • بطاقات ألعاب</p>
          </div>
        </div>
      )}
    </div>
  )
}
