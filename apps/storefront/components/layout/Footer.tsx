import Image from "next/image";
import Link from "next/link";
import { getSettings } from "@/lib/payload";

function resolveLogoUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const cmsOrigin =
    process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
  return `${cmsOrigin}${raw}`;
}

const footerLinks = [
  {
    title: "المتجر",
    links: [
      { label: "جميع المنتجات", href: "/products" },
      { label: "العروض", href: "/products?type=offers" },
    ],
  },
  {
    title: "الدعم",
    links: [
      { label: "تواصل معنا", href: "/support" },
      { label: "من نحن", href: "/about" },
    ],
  },
  {
    title: "السياسات",
    links: [
      { label: "الشروط والأحكام", href: "/policies/terms" },
      { label: "سياسة الاسترداد", href: "/policies/refund" },
      { label: "سياسة الخصوصية", href: "/policies/privacy" },
    ],
  },
];

export async function Footer() {
  let logoUrl: string | null = null;
  let storeName = "متجري";
  try {
    const settings = await getSettings();
    logoUrl = resolveLogoUrl((settings as any)?.logo?.url);
    if ((settings as any)?.siteName) storeName = (settings as any).siteName;
  } catch {}

  return (
    <footer className="mt-20 border-t border-[#e8e4f8] bg-white">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4">

          {/* Brand column */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5" aria-label={storeName}>
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={140}
                  height={48}
                  className="h-12 w-auto object-contain"
                  unoptimized
                />
              ) : (
                <>
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[#7C3AED] to-[#9333EA] shadow-[0_4px_12px_rgba(124,58,237,0.35)]">
                    <span className="text-lg font-black text-white">م</span>
                  </div>
                  <span className="text-lg font-black text-[#1e1b4b]">
                    {storeName}<span className="text-[#7C3AED]">.</span>
                  </span>
                </>
              )}
            </Link>
            <p className="mt-4 text-sm leading-relaxed text-[#6b7280]">
              متجرك الموثوق للمنتجات الرقمية — اشتراكات، مفاتيح، بطاقات ألعاب والمزيد.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              {["⚡ تسليم فوري", "🔒 دفع آمن"].map((b) => (
                <span
                  key={b}
                  className="rounded-full border border-[#ddd6fe] bg-[#f5f3ff] px-3 py-1 text-xs font-semibold text-[#7C3AED]"
                >
                  {b}
                </span>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 text-xs font-bold uppercase tracking-widest text-[#7C3AED]">
                {col.title}
              </h3>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-[#6b7280] transition-colors hover:text-[#7C3AED]"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 flex flex-col items-center gap-2 border-t border-[#f3f0ff] pt-6 sm:flex-row sm:justify-between">
          <p className="text-sm text-[#9ca3af]">
            © {new Date().getFullYear()} متجري. جميع الحقوق محفوظة.
          </p>
          <div className="flex items-center gap-1 text-sm text-[#9ca3af]">
            <span>مصنوع بـ</span>
            <span className="text-[#7C3AED]">♥</span>
            <span>في العالم العربي</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
