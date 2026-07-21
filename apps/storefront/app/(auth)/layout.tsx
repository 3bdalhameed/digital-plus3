import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings, getNavbarConfig } from "@/lib/payload";
import { resolveMediaUrl } from "@/lib/media-url";
import type { SiteSettings, NavbarConfig } from "@my-store/types";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let settings: SiteSettings | null = null;
  let navbarConfig: NavbarConfig | null = null;

  try {
    [settings, navbarConfig] = await Promise.all([
      getSettings(),
      getNavbarConfig(),
    ]);
  } catch {}

  // Same normalization as the shop + account layouts -- the browser
  // can't reach PAYLOAD_API_URL (internal Docker hostname), so resolve
  // media through PAYLOAD_PUBLIC_SERVER_URL via the shared helper.
  const logoUrl = resolveMediaUrl((settings as any)?.logo?.url) ?? null;
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

      <main className="flex min-h-[calc(100vh-200px)] items-center justify-center bg-brand-50 px-4 py-10">
        <div className="w-full max-w-md">
          <div className="mb-6 flex justify-center">
            {logoUrl ? (
              <Image
                src={logoUrl}
                alt="الشعار"
                width={160}
                height={56}
                className="object-contain"
                priority
                unoptimized
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA]">
                <span className="text-2xl font-black text-white">+</span>
              </div>
            )}
          </div>
          {children}
        </div>
      </main>

      <Footer />
    </>
  );
}
