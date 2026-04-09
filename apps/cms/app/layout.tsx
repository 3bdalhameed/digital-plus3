import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'لوحة التحكم | متجري',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar">
      <body>{children}</body>
    </html>
  )
}
