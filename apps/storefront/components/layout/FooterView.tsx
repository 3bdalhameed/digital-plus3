"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { Facebook, Twitter, Instagram } from "lucide-react";
import { useLocaleStore } from "@/lib/locale-store";
import { useEffect, useState } from "react";

/** Inline WhatsApp glyph — brand mark, sized via currentColor. */
function WhatsAppGlyph({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="currentColor" aria-hidden="true">
      <path d="M16.003 3C9.376 3 4 8.376 4 15.003c0 2.34.671 4.526 1.83 6.378L4 29l7.793-1.806A11.94 11.94 0 0 0 16.003 27C22.63 27 28 21.624 28 15.003 28 8.376 22.63 3 16.003 3Zm0 21.84c-1.984 0-3.83-.554-5.4-1.51l-.388-.232-4.625 1.073 1.092-4.504-.252-.412a9.832 9.832 0 0 1-1.555-5.252c0-5.443 4.43-9.872 9.876-9.872 2.638 0 5.115 1.027 6.98 2.892a9.806 9.806 0 0 1 2.892 6.98c0 5.443-4.43 9.836-9.872 9.836Zm5.418-7.357c-.296-.148-1.755-.866-2.027-.964-.272-.099-.47-.148-.668.148-.198.296-.766.964-.94 1.163-.173.198-.347.222-.643.074-.296-.148-1.252-.461-2.385-1.47-.88-.785-1.474-1.755-1.647-2.052-.173-.296-.018-.456.13-.604.133-.133.296-.347.444-.52.148-.173.198-.296.296-.495.099-.198.05-.371-.025-.52-.074-.148-.668-1.608-.915-2.2-.241-.578-.487-.5-.668-.51l-.57-.01c-.198 0-.52.074-.792.371-.272.296-1.04 1.016-1.04 2.476s1.065 2.872 1.213 3.07c.148.198 2.094 3.198 5.075 4.487.71.306 1.263.49 1.695.628.712.226 1.36.194 1.872.118.572-.085 1.755-.717 2.003-1.41.248-.692.248-1.287.173-1.41-.074-.124-.272-.198-.568-.346Z" />
    </svg>
  );
}

export type FooterLinkRow = { label: string; href: string };
export type PaymentChip = { name: string; color: string; imageUrl?: string };

// Hardcoded English fallbacks alongside Arabic. Editors can set CMS
// values (which take priority) but if empty we still render something
// sensible in the visitor's picked language.
const T_AR = {
  brandDescription:
    "نحن في ديجيتال بلس نوفّر اشتراكات رقمية أصلية لأشهر المنصات العالمية مثل Adobe و Canva و Envato و YouTube Premium وغيرها. نحرص على تقديم تجربة شراء آمنة وسريعة مع دعم فني متواصل",
  importantLinksTitle: "روابط مهمة",
  contactTitle:        "تواصل معنا",
  paymentTitle:        "طرق الدفع",
  phoneLabel:          "رقم الهاتف:",
  emailLabel:          "البريد الإلكتروني:",
  contactFormPrefix:   "نموذج الاتصال من",
  contactFormLink:     "هنا",
  importantLinks: [
    { label: "من نحن",                       href: "/about" },
    { label: "سياسة الاستخدام",             href: "/policies/terms" },
    { label: "سياسة الاسترجاع والاستبدال", href: "/policies/refund" },
    { label: "المدونة",                      href: "/blogs/news" },
  ] as FooterLinkRow[],
  policyLinks: [
    { label: "سياسة الشراء",            href: "/policies/terms" },
    { label: "سياسة الخصوصية",         href: "/policies/privacy" },
    { label: "وسائل الدفع المتوفرة",   href: "/about#payment" },
    { label: "خدمة التوريد B2B للتجار", href: "/about#b2b" },
  ] as FooterLinkRow[],
};
const T_EN = {
  brandDescription:
    "Digital Plus provides authentic digital subscriptions for the world's top platforms — Adobe, Canva, Envato, YouTube Premium, and more. We deliver a secure, fast purchase experience backed by continuous technical support.",
  importantLinksTitle: "Important Links",
  contactTitle:        "Contact Us",
  paymentTitle:        "Payment Methods",
  phoneLabel:          "Phone:",
  emailLabel:          "Email:",
  contactFormPrefix:   "Contact form",
  contactFormLink:     "here",
  importantLinks: [
    { label: "About",                    href: "/about" },
    { label: "Terms of Service",         href: "/policies/terms" },
    { label: "Refund & Return Policy",   href: "/policies/refund" },
    { label: "Blog",                     href: "/blogs/news" },
  ] as FooterLinkRow[],
  policyLinks: [
    { label: "Purchase Policy",       href: "/policies/terms" },
    { label: "Privacy Policy",        href: "/policies/privacy" },
    { label: "Accepted Payments",     href: "/about#payment" },
    { label: "B2B Wholesale",         href: "/about#b2b" },
  ] as FooterLinkRow[],
};

export interface FooterViewProps {
  logoUrl: string | null;
  storeName: string;
  brandDescription: string;
  /** Optional English variant from the CMS. When present, this takes
   *  priority over the hardcoded English fallback for EN visitors. */
  brandDescriptionEn?: string | null;
  importantLinksTitle: string;
  importantLinksTitleEn?: string | null;
  importantLinks: FooterLinkRow[];
  /** Optional EN version of the same links, sourced from labelEn on
   *  each CMS row. Null when the whole CMS list is empty (we then use
   *  the hardcoded T_EN.importantLinks) or when the editor hasn't
   *  filled any labelEn (Arabic labels are used). */
  importantLinksEn?: FooterLinkRow[] | null;
  policyLinks: FooterLinkRow[];
  policyLinksEn?: FooterLinkRow[] | null;
  contactTitle: string;
  contactTitleEn?: string | null;
  phone: string;
  email: string;
  contactFormUrl: string;
  paymentTitle: string;
  paymentTitleEn?: string | null;
  paymentMethods: PaymentChip[];
  copyrightText: string;
  copyrightTextEn?: string | null;
  /** True when the props above are the hardcoded Arabic defaults (no
   *  CMS overrides) — lets the client swap in the English hardcoded
   *  strings when the visitor picks EN. When any prop was set via CMS,
   *  its `<propName>IsDefault` flag will be false and we render the CMS
   *  value regardless of lang. */
  defaults: {
    brandDescription:    boolean;
    importantLinksTitle: boolean;
    contactTitle:        boolean;
    paymentTitle:        boolean;
    importantLinks:      boolean;
    policyLinks:         boolean;
  };
}

/**
 * Client-side render of the footer. Reads `lang` from the locale store
 * and, for each field, either renders the CMS value (if the editor set
 * one) or picks the hardcoded Arabic/English fallback based on lang.
 * Deferred to `mounted` to avoid the same hydration mismatch the header
 * had (Zustand persist reads after initial render → server-rendered
 * defaults must match the first client render).
 */
export function FooterView(props: FooterViewProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const lang = useLocaleStore((s) => s.lang);
  const useEn = mounted && lang === "en";
  const t = useEn ? T_EN : T_AR;

  // For each field the priority is:
  //   1. CMS EN value (if editor filled it and visitor picked EN)
  //   2. CMS AR value (if editor filled the AR field — regardless of lang)
  //   3. Hardcoded EN fallback (visitor picked EN and no CMS value at all)
  //   4. Hardcoded AR fallback (Arabic visitors, empty CMS)
  const brandDescription =
    useEn && props.brandDescriptionEn ? props.brandDescriptionEn
    : props.defaults.brandDescription ? t.brandDescription
    : props.brandDescription;
  const importantLinksTitle =
    useEn && props.importantLinksTitleEn ? props.importantLinksTitleEn
    : props.defaults.importantLinksTitle ? t.importantLinksTitle
    : props.importantLinksTitle;
  const contactTitle =
    useEn && props.contactTitleEn ? props.contactTitleEn
    : props.defaults.contactTitle ? t.contactTitle
    : props.contactTitle;
  const paymentTitle =
    useEn && props.paymentTitleEn ? props.paymentTitleEn
    : props.defaults.paymentTitle ? t.paymentTitle
    : props.paymentTitle;
  const importantLinks =
    useEn && props.importantLinksEn ? props.importantLinksEn
    : props.defaults.importantLinks ? t.importantLinks
    : props.importantLinks;
  const policyLinks =
    useEn && props.policyLinksEn ? props.policyLinksEn
    : props.defaults.policyLinks ? t.policyLinks
    : props.policyLinks;
  const copyrightText =
    useEn && props.copyrightTextEn ? props.copyrightTextEn : props.copyrightText;

  // Merge the two link lists into one flat grid to match the source
  // mockup (IMG_3208), which shows a single "روابط مهمة" section with
  // a 3-column grid of links underneath instead of two separate lists.
  const mergedLinks = [...importantLinks, ...policyLinks];

  return (
    <footer
      className="mx-3 mb-6 mt-20 overflow-hidden rounded-[28px] bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#7C3AED] text-white ring-1 ring-white/20 shadow-[0_18px_40px_rgba(91,33,182,0.25)] sm:mx-4"
      dir={useEn ? "ltr" : "rtl"}
    >
      <div className="mx-auto max-w-[64rem] px-4 py-12 text-center sm:px-6 lg:px-8">

        {/* ─── Brand block — centered logo, description, social row ── */}
        <div>
          <Link href="/" className="mx-auto mb-5 inline-flex items-center gap-2" aria-label={props.storeName}>
            {props.logoUrl ? (
              <Image
                src={props.logoUrl}
                alt={props.storeName}
                width={180}
                height={48}
                className="h-12 w-auto object-contain brightness-0 invert"
                unoptimized
              />
            ) : (
              <span className="text-xl font-black tracking-tight">{props.storeName}</span>
            )}
          </Link>
          <p className="mx-auto max-w-2xl text-sm leading-relaxed text-white/90 sm:text-base">
            {brandDescription}
            <span className="ms-1 text-pink-100">♡</span>
          </p>

          {/* Social row — icons only, no ring, minimal like the mockup */}
          <div className="mt-5 flex items-center justify-center gap-5">
            <SocialIcon href="https://facebook.com" label="Facebook"><Facebook className="h-5 w-5" strokeWidth={2} /></SocialIcon>
            <SocialIcon href="https://x.com" label="X (Twitter)"><Twitter className="h-5 w-5" strokeWidth={2} /></SocialIcon>
            <SocialIcon href="https://instagram.com" label="Instagram"><Instagram className="h-5 w-5" strokeWidth={2} /></SocialIcon>
            <SocialIcon href="https://wa.me/962795580312" label="WhatsApp"><WhatsAppGlyph className="h-5 w-5" /></SocialIcon>
          </div>
        </div>

        {/* ─── Important links — one heading + 3-column grid of merged
             links. Mobile also shows 3 columns so the layout matches
             the reference mockup exactly at every breakpoint. */}
        <div className="mt-10">
          <h3 className="mb-6 text-lg font-black text-white sm:text-xl">{importantLinksTitle}</h3>
          <ul className="mx-auto grid max-w-2xl grid-cols-3 gap-x-4 gap-y-4 text-sm sm:text-base">
            {mergedLinks.map((l, i) => (
              <li key={`${l.href}-${i}`} className="text-center">
                <Link href={l.href} className="inline-block text-white/90 transition-colors hover:text-white">
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* ─── Contact — centered heading + stacked contact lines ── */}
        <div className="mt-10">
          <h3 className="mb-5 text-lg font-black text-white sm:text-xl">{contactTitle}</h3>
          <ul className="space-y-3 text-sm sm:text-base">
            <li>
              <span className="text-white/75">{t.phoneLabel}</span>{" "}
              <a href={`tel:${props.phone}`} dir="ltr" className="text-white/95 hover:text-white">
                {props.phone}
              </a>
            </li>
            <li>
              <span className="text-white/75">{t.emailLabel}</span>{" "}
              <a href={`mailto:${props.email}`} dir="ltr" className="text-white/95 hover:text-white">
                {props.email}
              </a>
            </li>
            <li>
              <span className="text-white/75">{t.contactFormPrefix}</span>{" "}
              <Link href={props.contactFormUrl} className="text-white/95 underline underline-offset-2 hover:text-white">
                {t.contactFormLink}
              </Link>
            </li>
          </ul>
        </div>

        {/* ─── Divider ───────────────────────────────────────── */}
        <div className="my-10 h-px w-full bg-white/20" />

        {/* ─── Payment methods row ──────
             Label + logos render as a single centered cluster: label
             sits on the leading edge of that cluster (right in AR, left
             in EN), logos flow next to it, and the whole thing is
             centered on the row. Was previously flex-1 on the logos
             container which pinned the label to the far edge and left
             the logos loosely centered in whatever space remained,
             producing a lopsided row on wide screens. */}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-3" dir={useEn ? "ltr" : "rtl"}>
          <span className="text-base font-bold text-white sm:text-lg">{paymentTitle}</span>
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            {props.paymentMethods.map((p, i) => (
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
        </div>

        {/* ─── Copyright ─────────────────────────────────────── */}
        <div className="mt-6 text-center text-base text-white/80" dir={useEn ? "ltr" : "rtl"}>
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
      className="inline-flex items-center justify-center text-white/95 transition hover:text-white"
    >
      {children}
    </a>
  );
}
