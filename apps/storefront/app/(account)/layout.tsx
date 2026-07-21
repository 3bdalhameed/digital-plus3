import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings, getNavbarConfig } from "@/lib/payload";
import { resolveMediaUrl } from "@/lib/media-url";
import type { SiteSettings, NavbarConfig } from "@my-store/types";

/**
 * Account-scoped pages (/account, /support) share the same header
 * as the shop pages, so they need the same CMS-driven logo + navbar
 * config. Before this, this layout rendered `<Header />` with no
 * props, so `settings` was undefined inside Header, `logoUrl` was
 * undefined, and the brand-mark text fallback showed on every
 * account/support page instead of the uploaded logo.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  let settings: SiteSettings | null = null;
  let navbarConfig: NavbarConfig | null = null;

  try {
    [settings, navbarConfig] = await Promise.all([
      getSettings(),
      getNavbarConfig(),
    ]);
  } catch {}

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
      <Header settings={settingsForHeader} navbarConfig={navbarConfig} />
      <main className="mx-auto min-h-screen max-w-[90rem] px-4 py-8 sm:px-6 lg:px-8">{children}</main>
      <Footer />
    </>
  );
}
