import Image from "next/image";
import Link from "next/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { getSettings, getFooterConfig } from "@/lib/payload";

/** Inline WhatsApp glyph — brand mark, sized via currentColor. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.34.671 4.526 1.83 6.378L4 29l7.793-1.806A11.94 11.94 0 0 0 16.003 27C22.63 27 28 21.624 28 15.003 28 8.376 22.63 3 16.003 3Zm0 21.84c-1.984 0-3.83-.554-5.4-1.51l-.388-.232-4.625 1.073 1.092-4.504-.252-.412a9.832 9.832 0 0 1-1.555-5.252c0-5.443 4.43-9.872 9.876-9.872 2.638 0 5.115 1.027 6.98 2.892a9.806 9.806 0 0 1 2.892 6.98c0 5.443-4.43 9.836-9.872 9.836Zm5.418-7.357c-.296-.148-1.755-.866-2.027-.964-.272-.099-.47-.148-.668.148-.198.296-.766.964-.94 1.163-.173.198-.347.222-.643.074-.296-.148-1.252-.461-2.385-1.47-.88-.785-1.474-1.755-1.647-2.052-.173-.296-.018-.456.13-.604.133-.133.296-.347.444-.52.148-.173.198-.296.296-.495.099-.198.05-.371-.025-.52-.074-.148-.668-1.608-.915-2.2-.241-.578-.487-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.371-.272.296-1.04 1.016-1.04 2.476s1.065 2.872 1.213 3.07c.148.198 2.094 3.198 5.075 4.487.71.306 1.263.49 1.695.628.712.226 1.36.194 1.872.118.572-.085 1.755-.717 2.003-1.41.248-.692.248-1.287.173-1.41-.074-.124-.272-.198-.568-.346Z" />
    </svg>
  );
}

function resolveLogoUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const cmsOrigin =
    process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
  return `${cmsOrigin}${raw}`;
}

/* ── Hardcoded fallbacks ──────────────────────────────────────────
   Every CMS-controlled text on the footer has a fallback so a fresh
   deploy with an empty FooterConfig still renders the original copy.
   Editors override any of these via /admin/globals/footer-config. */

const DEFAULT_BRAND_DESCRIPTION =
  "نحن في ديجيتال بلس نوفّر اشتراكات رقمية أصلية لأشهر المنصات العالمية مثل Adobe و Canva و Envato و YouTube Premium وغيرها. نحرص على تقديم تجربة شراء آمنة وسريعة مع دعم فني متواصل";

const DEFAULT_IMPORTANT_LINKS_TITLE = "روابط مهمة";
const DEFAULT_IMPORTANT_LINKS: FooterLinkRow[] = [
  { label: "من نحن",                       href: "/about" },
  { label: "سياسة الاستخدام",             href: "/policies/terms" },
  { label: "سياسة الاسترجاع والاستبدال", href: "/policies/refund" },
  { label: "المدونة",                      href: "/blogs/news" },
];

const DEFAULT_POLICY_LINKS: FooterLinkRow[] = [
  { label: "سياسة الشراء",            href: "/policies/terms" },
  { label: "سياسة الخصوصية",         href: "/policies/privacy" },
  { label: "وسائل الدفع المتوفرة",   href: "/about#payment" },
  { label: "خدمة التوريد B2B للتجار", href: "/about#b2b" },
];

const DEFAULT_CONTACT_TITLE   = "تواصل معنا";
const DEFAULT_PHONE           = "+962795580312";
const DEFAULT_EMAIL           = "info@digital-plus3.com";
const DEFAULT_CONTACT_FORM    = "/support";

const DEFAULT_PAYMENT_TITLE = "طرق الدفع";

const DEFAULT_COPYRIGHT_TEMPLATE =
  "© Digital Plus | جميع الحقوق محفوظة | Copyright {year}";

type FooterLinkRow = { label: string; href: string };
type PaymentChip = { name: string; color: string; imageUrl?: string };

const DEFAULT_PAYMENT_METHODS: PaymentChip[] = [
  { name: "DISCOVER",     color: "#FF6000" },
  { name: "Diners Club",  color: "#0079BE" },
  { name: "UnionPay",     color: "#E21836" },
  { name: "AMEX",         color: "#2E77BB" },
  { name: "Maestro",      color: "#EB001B" },
  { name: "MasterCard",   color: "#EB001B" },
  { name: "VISA",         color: "#1A1F71" },
  { name: "G Pay",        color: "#000000" },
  { name: "Apple Pay",    color: "#000000" },
];

/** Substitute `{year}` in the copyright template with the current year. */
function expandCopyright(template: string, year: number): string {
  return template.replace(/\{year\}/gi, String(year));
}

/** Sanitize a CMS-supplied link array into a render-safe one, dropping any
 *  rows that are missing either field. */
function cleanLinks(arr: unknown): FooterLinkRow[] | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out = arr
    .filter((l: any) => l && typeof l.label === "string" && typeof l.href === "string" && l.label.trim() && l.href.trim())
    .map((l: any) => ({ label: String(l.label), href: String(l.href) }));
  return out.length > 0 ? out : null;
}

export async function Footer() {
  let logoUrl: string | null = null;
  let storeName = "ديجيتال بلس";
  let footerCfg: any = null;
  try {
    const [settings, cfg] = await Promise.all([
      getSettings(),
      getFooterConfig().catch(() => null),
    ]);
    logoUrl = resolveLogoUrl((settings as any)?.logo?.url);
    if ((settings as any)?.siteName) storeName = (settings as any).siteName;
    footerCfg = cfg || {};
  } catch {
    footerCfg = {};
  }

  // ── Text overrides ────────────────────────────────────────────
  const brandDescription      = footerCfg.brandDescription      || DEFAULT_BRAND_DESCRIPTION;
  const importantLinksTitle   = footerCfg.importantLinksTitle   || DEFAULT_IMPORTANT_LINKS_TITLE;
  const contactTitle          = footerCfg.contactTitle          || DEFAULT_CONTACT_TITLE;
  const phone                 = footerCfg.phone                 || DEFAULT_PHONE;
  const email                 = footerCfg.email                 || DEFAULT_EMAIL;
  const contactFormUrl        = footerCfg.contactFormUrl        || DEFAULT_CONTACT_FORM;
  const paymentTitle          = footerCfg.paymentTitle          || DEFAULT_PAYMENT_TITLE;
  const importantLinks        = cleanLinks(footerCfg.importantLinks) || DEFAULT_IMPORTANT_LINKS;
  const policyLinks           = cleanLinks(footerCfg.policyLinks)    || DEFAULT_POLICY_LINKS;

  // ── Payment methods (image OR text chip) ──────────────────────
  let paymentMethods: PaymentChip[] = DEFAULT_PAYMENT_METHODS;
  const cmsMethods = footerCfg.paymentMethods as
    | Array<{ name?: string; color?: string; image?: any }>
    | undefined;
  if (cmsMethods && cmsMethods.length > 0) {
    paymentMethods = cmsMethods
      .filter((m) => m?.name)
      .map((m) => ({
        name: String(m.name),
        color: String(m.color || "#1A1F71"),
        imageUrl:
          m.image && typeof m.image === "object" && typeof m.image.url === "string"
            ? m.image.url
            : undefined,
      }));
  }

  const year = new Date().getFullYear();
  const copyrightText = expandCopyright(
    footerCfg.copyrightText || DEFAULT_COPYRIGHT_TEMPLATE,
    year
  );

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
              {brandDescription}
              <span className="ms-1 text-pink-200">♥</span>
            </p>

            {/* Social icons */}
            <div className="mt-4 flex items-center gap-3">
              <SocialIcon href="https://facebook.com" label="Facebook"><Facebook className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://x.com" label="X (Twitter)"><Twitter className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://instagram.com" label="Instagram"><Instagram className="h-4 w-4" /></SocialIcon>
              <SocialIcon href="https://wa.me/962795580312" label="WhatsApp"><WhatsAppGlyph className="h-4 w-4" /></SocialIcon>
            </div>
          </div>

          {/* 2. Important links */}
          <div>
            <h3 className="mb-5 text-base font-black text-white sm:text-lg">{importantLinksTitle}</h3>
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
            <h3 className="mb-5 text-base font-black text-white sm:text-lg">{contactTitle}</h3>
            <ul className="space-y-3 text-base">
              <li>
                <span className="text-white/70">رقم الهاتف:</span>{" "}
                <a href={`tel:${phone}`} dir="ltr" className="text-white/90 hover:text-white">
                  {phone}
                </a>
              </li>
              <li>
                <span className="text-white/70">البريد الإلكتروني:</span>{" "}
                <a href={`mailto:${email}`} dir="ltr" className="text-white/90 hover:text-white">
                  {email}
                </a>
              </li>
              <li>
                <span className="text-white/70">نموذج الاتصال من</span>{" "}
                <Link href={contactFormUrl} className="text-white/90 underline-offset-2 hover:text-white hover:underline">
                  هنا
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* ─── Divider ───────────────────────────────────────── */}
        <div className="my-10 h-px w-full bg-white/20" />

        {/* ─── Payment methods row (label + inline pills, centered) ─── */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3" dir="rtl">
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {paymentMethods.map((p, i) => (
              <span
                key={`${p.name}-${i}`}
                className="flex h-8 min-w-[48px] items-center justify-center overflow-hidden rounded-[6px] bg-white px-2.5 text-[11px] font-black uppercase tracking-tight shadow-[0_1px_2px_rgba(0,0,0,0.15)]"
                style={{ color: p.color }}
                title={p.name}
                dir="ltr"
              >
                {p.imageUrl ? (
                  <Image
                    src={p.imageUrl}
                    alt={p.name}
                    width={56}
                    height={28}
                    className="h-6 w-auto object-contain"
                    unoptimized
                  />
                ) : (
                  p.name
                )}
              </span>
            ))}
          </div>
          <span className="text-base font-bold text-white sm:text-lg">{paymentTitle}</span>
        </div>

        {/* ─── Copyright ─────────────────────────────────────── */}
        <div className="mt-6 text-center text-base text-white/80" dir="rtl">
          {copyrightText}
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
