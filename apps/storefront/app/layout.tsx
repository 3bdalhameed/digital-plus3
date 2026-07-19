import type { Metadata } from "next";
import { Providers } from "@/components/layout/Providers";
import { getSettings } from "@/lib/payload";
import "@/styles/globals.css";

/**
 * Metadata is computed per-request so the tab favicon reflects
 * whatever the admin uploaded under Site Settings -> Favicon in the
 * CMS. Payload's absolute URL is preferred; if only a relative path
 * comes back we prefix the CMS origin so the browser can fetch it
 * cross-origin from the storefront domain. Falls back to null (no
 * favicon set) rather than throwing so a CMS outage doesn't 500
 * every storefront page.
 */
export async function generateMetadata(): Promise<Metadata> {
  let faviconUrl: string | null = null;
  let siteName: string | null = null;
  try {
    const settings = await getSettings();
    siteName = (settings as any)?.siteName ?? null;
    const raw = (settings as any)?.favicon?.url as string | undefined;
    if (raw) {
      if (raw.startsWith("http")) {
        faviconUrl = raw;
      } else {
        const cmsOrigin =
          process.env.PAYLOAD_API_URL?.replace(/\/api\/?$/, "") ||
          "http://localhost:3001";
        faviconUrl = `${cmsOrigin}${raw}`;
      }
    }
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
