import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: {
    default: "متجري — منتجات رقمية موثوقة",
    template: "%s | متجري",
  },
  description:
    "متجرك الموثوق للمنتجات الرقمية: اشتراكات، مفاتيح ترخيص، بطاقات ألعاب، وأدوات ذكاء اصطناعي.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ar" dir="rtl" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Arabic:wght@100;200;300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen font-ibm antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
