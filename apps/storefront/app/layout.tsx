import type { Metadata } from 'next'
import { Cairo } from 'next/font/google'
import './globals.css'
import { Providers } from './providers'
import { getSettings } from '@/lib/payload'

const cairo = Cairo({
  subsets: ['arabic', 'latin'],
  weight: ['300', '400', '500', '600', '700', '800', '900'],
  variable: '--font-cairo',
  display: 'swap',
})

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getSettings() as any
    return {
      title: {
        template: `%s | ${settings?.siteName || 'متجري'}`,
        default: settings?.siteName || 'متجري - منتجات رقمية',
      },
      description: 'اشتراكات برمجية، مفاتيح ترخيص، بطاقات ألعاب وأكثر',
      icons: settings?.favicon?.url ? { icon: settings.favicon.url } : {},
    }
  } catch {
    return {
      title: { template: '%s | متجري', default: 'متجري - منتجات رقمية' },
      description: 'اشتراكات برمجية، مفاتيح ترخيص، بطاقات ألعاب وأكثر',
    }
  }
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="ar" dir="rtl" className={cairo.variable}>
      <body className="min-h-screen bg-background font-arabic">
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
