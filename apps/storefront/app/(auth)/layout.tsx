import Image from "next/image";

async function getLogoUrl(): Promise<string | null> {
  try {
    const cmsUrl = process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
    const res = await fetch(`${cmsUrl}/api/globals/settings?depth=1`, {
      cache: "no-store",
    });
    const data = await res.json();
    return data?.logo?.url ?? null;
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
              alt="Logo"
              width={160}
              height={56}
              className="object-contain"
              priority
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
