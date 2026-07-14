import { getSettings, getFooterConfig } from "@/lib/payload";
import { FooterView, type FooterLinkRow, type PaymentChip } from "./FooterView";

function resolveLogoUrl(raw: string | undefined): string | null {
  if (!raw) return null;
  if (raw.startsWith("http")) return raw;
  const cmsOrigin =
    process.env.PAYLOAD_API_URL?.replace("/api", "") || "http://localhost:3001";
  return `${cmsOrigin}${raw}`;
}

/* ── Hardcoded Arabic fallbacks ──────────────────────────────────
   The FooterView client component has parallel English fallbacks and
   swaps based on `lang`. Anything the editor sets in the CMS wins
   over these; the `defaults` map below tells the client which fields
   are still on their Arabic-only fallback so it can substitute the
   English variant instead. */

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

function expandCopyright(template: string, year: number): string {
  return template.replace(/\{year\}/gi, String(year));
}

function cleanLinks(arr: unknown): FooterLinkRow[] | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out = arr
    .filter((l: any) => l && typeof l.label === "string" && typeof l.href === "string" && l.label.trim() && l.href.trim())
    .map((l: any) => ({ label: String(l.label), href: String(l.href) }));
  return out.length > 0 ? out : null;
}

/** Build the English link list from CMS rows, using labelEn per row.
 *  Rows with an empty labelEn fall back to the Arabic label so a
 *  half-translated list still renders every link. Returns null when
 *  the whole CMS list is empty. */
function cleanLinksEn(arr: unknown): FooterLinkRow[] | null {
  if (!Array.isArray(arr) || arr.length === 0) return null;
  const out = arr
    .filter((l: any) => l && typeof l.href === "string" && l.href.trim())
    .map((l: any) => ({
      label: (typeof l.labelEn === "string" && l.labelEn.trim()) ? String(l.labelEn) : String(l.label ?? ""),
      href: String(l.href),
    }))
    .filter((l) => l.label.trim());
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

  const cmsImportantLinks = cleanLinks(footerCfg.importantLinks);
  const cmsPolicyLinks    = cleanLinks(footerCfg.policyLinks);
  const cmsImportantLinksEn = cleanLinksEn(footerCfg.importantLinks);
  const cmsPolicyLinksEn    = cleanLinksEn(footerCfg.policyLinks);

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

  const copyrightTextEn = footerCfg.copyrightTextEn
    ? expandCopyright(footerCfg.copyrightTextEn, year)
    : null;

  return (
    <FooterView
      logoUrl={logoUrl}
      storeName={storeName}
      brandDescription={footerCfg.brandDescription || DEFAULT_BRAND_DESCRIPTION}
      brandDescriptionEn={footerCfg.brandDescriptionEn || null}
      importantLinksTitle={footerCfg.importantLinksTitle || DEFAULT_IMPORTANT_LINKS_TITLE}
      importantLinksTitleEn={footerCfg.importantLinksTitleEn || null}
      importantLinks={cmsImportantLinks || DEFAULT_IMPORTANT_LINKS}
      importantLinksEn={cmsImportantLinksEn}
      policyLinks={cmsPolicyLinks || DEFAULT_POLICY_LINKS}
      policyLinksEn={cmsPolicyLinksEn}
      contactTitle={footerCfg.contactTitle || DEFAULT_CONTACT_TITLE}
      contactTitleEn={footerCfg.contactTitleEn || null}
      phone={footerCfg.phone || DEFAULT_PHONE}
      email={footerCfg.email || DEFAULT_EMAIL}
      contactFormUrl={footerCfg.contactFormUrl || DEFAULT_CONTACT_FORM}
      paymentTitle={footerCfg.paymentTitle || DEFAULT_PAYMENT_TITLE}
      paymentTitleEn={footerCfg.paymentTitleEn || null}
      paymentMethods={paymentMethods}
      copyrightText={copyrightText}
      copyrightTextEn={copyrightTextEn}
      defaults={{
        brandDescription:    !footerCfg.brandDescription,
        importantLinksTitle: !footerCfg.importantLinksTitle,
        contactTitle:        !footerCfg.contactTitle,
        paymentTitle:        !footerCfg.paymentTitle,
        importantLinks:      !cmsImportantLinks,
        policyLinks:         !cmsPolicyLinks,
      }}
    />
  );
}
