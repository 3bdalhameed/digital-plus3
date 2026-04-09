import Link from 'next/link'
import { getFooterConfig, getSettings } from '@/lib/payload'

export async function Footer() {
  const [footer, settings] = await Promise.all([
    getFooterConfig().catch(() => null),
    getSettings().catch(() => null),
  ]) as [any, any]

  return (
    <footer className="bg-primary-dark text-white mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Columns */}
        {footer?.columns?.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
            {footer.columns.map((col: any, i: number) => (
              <div key={i}>
                <h4 className="font-bold text-purple-200 mb-4">{col.title}</h4>
                <ul className="space-y-2">
                  {col.links?.map((link: any, j: number) => (
                    <li key={j}>
                      <Link
                        href={link.url}
                        className="text-purple-300 hover:text-white text-sm transition-colors"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}

        {/* Default links if no CMS config */}
        {(!footer?.columns?.length) && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
            <div>
              <h4 className="font-bold text-purple-200 mb-4">المتجر</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><Link href="/products" className="hover:text-white transition-colors">جميع المنتجات</Link></li>
                <li><Link href="/about" className="hover:text-white transition-colors">عن المتجر</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-purple-200 mb-4">حسابي</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><Link href="/orders" className="hover:text-white transition-colors">طلباتي</Link></li>
                <li><Link href="/account" className="hover:text-white transition-colors">الملف الشخصي</Link></li>
                <li><Link href="/support" className="hover:text-white transition-colors">الدعم الفني</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold text-purple-200 mb-4">السياسات</h4>
              <ul className="space-y-2 text-sm text-purple-300">
                <li><Link href="/policies/terms" className="hover:text-white transition-colors">الشروط والأحكام</Link></li>
                <li><Link href="/policies/refund" className="hover:text-white transition-colors">سياسة الاسترجاع</Link></li>
                <li><Link href="/policies/privacy" className="hover:text-white transition-colors">سياسة الخصوصية</Link></li>
              </ul>
            </div>
          </div>
        )}

        <div className="border-t border-purple-800 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-purple-400 text-sm">
            {footer?.bottomText || `© ${new Date().getFullYear()} ${settings?.siteName || 'متجري'}. جميع الحقوق محفوظة.`}
          </p>
          <div className="flex gap-4">
            {footer?.policyLinks?.map((link: any, i: number) => (
              <Link key={i} href={link.url} className="text-purple-400 hover:text-white text-xs transition-colors">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
