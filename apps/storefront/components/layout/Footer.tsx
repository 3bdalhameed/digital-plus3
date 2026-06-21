import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram, AtSign } from "lucide-react";
import { getSettings } from "@/lib/payload";

function resolveLogoUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const cmsOrigin =
    process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
  return `${cmsOrigin}${raw}`;
}

/* ── Link columns mirror the live Shopify footer exactly ──────── */

const importantLinks = [
  { label: "من نحن",                       href: "/about" },
  { label: "سياسة الاستخدام",             href: "/policies/terms" },
  { label: "سياسة الاسترجاع والاستبدال", href: "/policies/refund" },
  { label: "المدونة",                      href: "/blogs/news" },
];

const policyLinks = [
  { label: "سياسة الشراء",            href: "/policies/terms" },
  { label: "سياسة الخصوصية",         href: "/policies/privacy" },
  { label: "وسائل الدفع المتوفرة",   href: "/about#payment" },
  { label: "خدمة التوريد B2B للتجار", href: "/about#b2b" },
];

/* Payment methods — rendered as small white pill chips with the brand
   name in its trademark color. Cheap visual stand-in for real SVGs. */
const paymentMethods: Array<{ name: string; color: string }> = [
  { name: "DISCOVER",  color: "#FF6000" },
  { name: "Diners",    color: "#0079BE" },
  { name: "Maestro",   color: "#0066B2" },
  { name: "AMEX",      color: "#2E77BB" },
  { name: "MasterCard", color: "#EB001B" },
  { name: "MasterCard", color: "#EB001B" },
  { name: "VISA",      color: "#1A1F71" },
  { name: "G Pay",     color: "#000000" },
  { name: "Apple Pay", color: "#000000" },
];

export async function Footer() {
  let logoUrl: string | null = null;
  let storeName = "ديجيتال بلس";
  try {
    const settings = await getSettings();
    logoUrl = resolveLogoUrl((settings as any)?.logo?.url);
    if ((settings as any)?.siteName) storeName = (settings as any).siteName;
  } catch {}

  const year = new Date().getFullYear();

  return (
    <footer
      className="mx-3 mb-6 mt-20 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#7C3AED] text-white ring-1 ring-white/20 shadow-[0_18px_40px_rgba(91,33,182,0.25)] sm:mx-4"
      dir="rtl"
    >
      <div className="mx-auto max-w-[90rem] px-4 py-12 sm:px-6 lg:px-8">

        {/* ─── Top: 4 content columns (RTL — brand first / right) ──── */}
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">

          {/* 1. Brand block (right-most in RTL) */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2" aria-label={storeName}>
              {logoUrl ? (
                <Image
                  src={logoUrl}
                  alt={storeName}
                  width={150}
                  height={40}
                  className="h-10 w-auto object-contain brightness-0 invert"
                  unoptimized
                />
              ) : (
                <span className="text-lg font-black tracking-tight">{storeName}</span>
              )}
            </Link>
            <p className="text-base leading-relaxed text-white/90">
              نحن في ديجيتال بلس نوفّر اشتراكات رقمية أصلية لأشهر المنصات العالمية مثل Adobe و Canva و Envato و YouTube Premium وغيرها. نحرص على تقديم تجربة شراء آمنة وسريعة مع دعم فني متواصل
              <span className="ms-1 text-pink-200">♥</span>
            </p>

            {/* Social icons */}
            <div className="mt-4 flex items-center gap-3">
              <SocialIcon href="https://facebook.com" label="Facebook"><Facebook className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://x.com" label="X (Twitter)"><Twitter className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://instagram.com" label="Instagram"><Instagram className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://threads.net" label="Threads"><AtSign className="h-4 w-4" /></SocialIcon>
            </div>
          </div>

          {/* 2. Important links */}
          <div>
            <h3 className="mb-5 text-base font-black text-white sm:text-lg">روابط مهمة</h3>
            <ul className="space-y-3 text-base">
              {importantLinks.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-white/90 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Policy column (no header in the source design) */}
          <div>
            <h3 className="mb-5 text-base font-black text-white/0 select-none sm:text-lg" aria-hidden>.</h3>
            <ul className="space-y-3 text-base">
              {policyLinks.map((l) => (
                <li key={l.href + l.label}>
                  <Link href={l.href} className="text-white/90 transition-colors hover:text-white">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* 4. Contact us (left-most in RTL) */}
          <div>
            <h3 className="mb-5 text-base font-black text-white sm:text-lg">تواصل معنا</h3>
            <ul className="space-y-3 text-base">
              <li>
                <span className="text-white/70">رقم الهاتف:</span>{" "}
                <a href="tel:+962795580312" dir="ltr" className="text-white/90 hover:text-white">
                  +962795580312
                </a>
              </li>
              <li>
                <span className="text-white/70">البريد الإلكتروني:</span>{" "}
                <a href="mailto:info@digital-plus3.com" dir="ltr" className="text-white/90 hover:text-white">
                  info@digital-plus3.com
                </a>
              </li>
              <li>
                <span className="text-white/70">نموذج الاتصال من</span>{" "}
                <Link href="/support" className="text-white/90 underline-offset-2 hover:text-white hover:underline">
                  هنا
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Divider ───────────────────────────────────────── */}
        <div className="my-10 h-px w-full bg-white/20" />

        {/* ─── Payment methods row (centered, label above chips) ─── */}
        <div className="flex flex-col items-center gap-3">
          <span className="text-base font-bold text-white/90 sm:text-lg">طرق الدفع</span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {paymentMethods.map((p, i) => (
              <span
                key={`${p.name}-${i}`}
                className="flex h-7 min-w-[44px] items-center justify-center rounded-md bg-white px-2 text-[10px] font-black shadow-sm"
                style={{ color: p.color }}
              >
                {p.name}
              </span>
            ))}
          </div>
        </div>

        {/* ─── Copyright ─────────────────────────────────────── */}
        <div className="mt-6 text-center text-base text-white/80">
          <span dir="ltr">© Digital Plus</span>
          <span className="mx-2 text-white/50">|</span>
          <span>جميع الحقوق محفوظة</span>
          <span className="mx-2 text-white/50">|</span>
          <span dir="ltr">Copyright {year}</span>
        </div>
      </div>
    </footer>
  );
}

function SocialIcon({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={label}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-white/15 text-white transition hover:bg-white/30"
    >
      {children}
    </a>
  );
}
