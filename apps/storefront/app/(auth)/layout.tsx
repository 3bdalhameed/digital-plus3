import Image from "next/image";
import { getSettings } from "@/lib/payload";

async function getLogoUrl(): Promise<string | null> {
  try {
    const settings = await getSettings();
    const raw = (settings as any)?.logo?.url as string | undefined;
    if (!raw) return null;
    // Payload may return an absolute URL using PAYLOAD_PUBLIC_SERVER_URL.
    // If it's already absolute, use it directly; otherwise prepend the CMS origin.
    if (raw.startsWith("http")) return raw;
    const cmsOrigin =
      process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
    return `${cmsOrigin}${raw}`;
  } catch {
    return null;
  }
}

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getLogoUrl();

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-50 p-4">
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
    </div>
  );
}
