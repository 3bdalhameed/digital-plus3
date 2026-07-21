import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import { getSettings } from "@/lib/payload";
import { resolveMediaUrl } from "@/lib/media-url";
import "@/styles/globals.css";

/**
 * Metadata is computed per-request so the tab favicon reflects
 * whatever the admin uploaded under Site Settings -> Favicon in the
 * CMS. `resolveMediaUrl` picks the browser-reachable public origin
 * and prefixes when Payload returns a bare "/media/xxx.png".
 */
export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl: string | null = null;
  let siteName: string | null = null;
  try {
    const settings = await getSettings();
    siteName = (settings as any)?.siteName ?? null;
    faviconUrl = resolveMediaUrl((settings as any)?.favicon?.url) ?? null;
  } catch { /* no favicon — use default */ }

  const defaultTitle = siteName || "متجري — منتجات رقمية موثوقة";
  return {
    title: {
      default: defaultTitle,
      template: `%s | ${siteName || "متجري"}`,
    },
    description:
      "متجرك الموثوق للمنتجات الرقمية: اشتراكات، مفاتيح ترخيص، بطاقات ألعاب، وأدوات ذكاء اصطناعي.",
    icons: faviconUrl ? { icon: faviconUrl, shortcut: faviconUrl, apple: faviconUrl } : undefined,
  };
}

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
