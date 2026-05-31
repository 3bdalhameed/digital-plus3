import Image from "next/image";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { getSettings, getNavbarConfig } from "@/lib/payload";
import type { SiteSettings, NavbarConfig } from "@my-store/types";

async function getLogoUrl(settings: SiteSettings | null): Promise<string | null> {
  try {
    const raw = (settings as any)?.logo?.url as string | undefined;
    if (!raw) return null;
    if (raw.startsWith("http")) return raw;
    const cmsOrigin =
      process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
    return `${cmsOrigin}${raw}`;
  } catch {
    return null;
  }
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  let settings: SiteSettings | null = null;
  let navbarConfig: NavbarConfig | null = null;

  try {
    [settings, navbarConfig] = await Promise.all([
      getSettings(),
      getNavbarConfig(),
    ]);
  } catch {}

  const logoUrl = await getLogoUrl(settings);

  return (
    <>
      <Header settings={settings} navbarConfig={navbarConfig} />

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
