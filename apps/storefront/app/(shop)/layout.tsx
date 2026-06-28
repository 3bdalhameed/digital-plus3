import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PreviewBanner } from "@/components/layout/PreviewBanner";
import { WhatsAppButton } from "@/components/layout/WhatsAppButton";
import { ExitIntentPopup } from "@/components/ExitIntentPopup";
import { getSettings, getNavbarConfig } from "@/lib/payload";
import type { SiteSettings, NavbarConfig } from "@my-store/types";

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

  return (
    <>
      <PreviewBanner />
      <Header settings={settings} navbarConfig={navbarConfig} />
      <main className="mx-auto min-h-screen max-w-[90rem] px-2 pb-8 pt-3 sm:px-3 lg:px-4">
        {children}
      </main>
      <Footer />
      <WhatsAppButton
        url={settings?.whatsappUrl}
        phone={settings?.whatsappNumber}
      />
      <ExitIntentPopup />
    </>
  );
}
