import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { getSettings, getNavbarConfig } from "@/lib/payload";
import type { SiteSettings, NavbarConfig } from "@my-store/types";

/**
 * Payload returns media URLs as either absolute (when
 * PAYLOAD_PUBLIC_SERVER_URL is set on the CMS side) or as a
 * relative "/media/xxx.png". The storefront runs on a different
 * origin from the CMS, so relative URLs 404 from the browser.
 *
 * Prefix with the PUBLIC CMS origin whenever we get back a bare
 * path. PAYLOAD_API_URL is the internal Docker hostname
 * (http://cms:3001/api) used by server-side fetches; the browser
 * can't reach that. PAYLOAD_PUBLIC_SERVER_URL is the URL an end
 * user's browser CAN reach (https://cms.digital-plus3.com) -- try
 * that first, only fall back to PAYLOAD_API_URL for local dev
 * where they're often the same.
 */
function resolveMediaUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http")) return url;
  const publicOrigin =
    process.env.PAYLOAD_PUBLIC_SERVER_URL?.replace(/\/$/, "") ||
    process.env.PAYLOAD_API_URL?.replace(/\/api\/?$/, "") ||
    "http://localhost:3001";
  return `${publicOrigin}${url.startsWith("/") ? "" : "/"}${url}`;
}

export default async function ShopLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  let settings: SiteSettings | null = null;
  let navbarConfig: NavbarConfig | null = null;

  try {
    [settings, navbarConfig] = await Promise.all([
      getSettings(),
      getNavbarConfig(),
    ]);
  } catch {}

  // Normalize the logo URL to absolute so the Header <Image> loads
  // from the CMS instead of trying the storefront origin. Cloned
  // rather than mutated so downstream consumers (favicon in the
  // root layout, other pages) keep whatever shape they expect.
  const settingsForHeader: SiteSettings | null = settings
    ? ({
        ...settings,
        logo: settings.logo
          ? { ...(settings.logo as any), url: resolveMediaUrl((settings.logo as any)?.url) }
          : settings.logo,
      } as SiteSettings)
    : null;

  return (
    <>
      <PreviewBanner />
      <Header settings={settingsForHeader} navbarConfig={navbarConfig} />
      <main className="mx-auto min-h-screen max-w-[90rem] px-2 pb-8 pt-3 sm:px-3 lg:px-4">
        {children}
      </main>
      <Footer />
      <WhatsAppButton
        url={settings?.whatsappUrl}
        phone={settings?.whatsappNumber}
      />
      <ExitIntentPopup
        cms={{
          enabled:       (settings as any)?.exitPopupEnabled,
          couponCode:    (settings as any)?.exitPopupCouponCode,
          headlineAr:    (settings as any)?.exitPopupHeadlineAr,
          headlineEn:    (settings as any)?.exitPopupHeadlineEn,
          subheadlineAr: (settings as any)?.exitPopupSubheadlineAr,
          subheadlineEn: (settings as any)?.exitPopupSubheadlineEn,
          bodyAr:        (settings as any)?.exitPopupBodyAr,
          bodyEn:        (settings as any)?.exitPopupBodyEn,
        }}
      />
    </>
  );
}
