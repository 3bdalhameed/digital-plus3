"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Zap, ArrowLeft, ArrowRight, RefreshCw, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useState, useEffect, useRef, useId } from "react";
import type { HomePageSection } from "@my-store/types";

// ── Horizontal product carousel ─────────────────────────────────
function ProductCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = (el.firstChild as HTMLElement)?.offsetWidth ?? 220;
    el.scrollBy({ left: dir === "left" ? -(cardW + 8) : (cardW + 8), behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-2 overflow-x-auto pt-2 pb-3 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Minimal chevron arrows — desktop only. Click hit-area is generous
          (40px square) while the icon stays small and thin so it reads as
          a hint, not a heavy nav button. */}
      <button
        onClick={() => scroll("right")}
        className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center text-[#6b7280] transition-colors hover:text-[#1e1b4b] sm:flex"
        aria-label="السابق"
      >
        <ChevronRight className="h-7 w-7" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => scroll("left")}
        className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 -translate-x-1/2 items-center justify-center text-[#6b7280] transition-colors hover:text-[#1e1b4b] sm:flex"
        aria-label="التالي"
      >
        <ChevronLeft className="h-7 w-7" strokeWidth={1.5} />
      </button>
    </div>
  );
}

// ── Layout helpers ──────────────────────────────────────────────
const widthClass: Record<string, string> = {
  sm:   "max-w-2xl mx-auto",
  md:   "max-w-4xl mx-auto",
  lg:   "max-w-6xl mx-auto",
  xl:   "max-w-[90rem] mx-auto",
  full: "w-full",
};
const paddingClass: Record<string, string> = {
  none: "py-0",
  xs:   "py-2",
  sm:   "py-4",
  md:   "py-6",
  lg:   "py-10",
  xl:   "py-16",
};

function SectionWrapper({ section, children }: { section: any; children: React.ReactNode }) {
  const w = widthClass[section.width  ?? "xl"] ?? widthClass.xl;
  const p = paddingClass[section.paddingY ?? "sm"] ?? paddingClass.sm;
  return <div className={`${w} ${p}`}>{children}</div>;
}

export function SectionRenderer({ section }: { section: HomePageSection }) {
  if (!section.enabled) return null;

  switch (section.blockType) {
    case "heroBanner":       return <SectionWrapper section={section}><HeroBannerSection {...section} /></SectionWrapper>;
    case "multiImageBanner": return <SectionWrapper section={section}><MultiImageBanner {...section} /></SectionWrapper>;
    case "featuredProducts": return <SectionWrapper section={section}><FeaturedProductsSection {...section} /></SectionWrapper>;
    case "categoryGrid":     return <SectionWrapper section={section}><CategoryGridSection {...section} /></SectionWrapper>;
    case "categoryBanners":  return <CategoryBannersSection {...section} />;
    case "categoryRow":      return <CategoryRowSection {...section} />;
    case "imageWithText":    return <SectionWrapper section={section}><ImageWithTextSection {...section} /></SectionWrapper>;
    case "featureBlocks":    return <SectionWrapper section={section}><FeatureBlocksSection {...section} /></SectionWrapper>;
    case "statsSection":     return <SectionWrapper section={section}><StatsSectionBlock {...section} /></SectionWrapper>;
    case "testimonials":     return <SectionWrapper section={section}><TestimonialsSection {...section} /></SectionWrapper>;
    case "faqSection":       return <SectionWrapper section={section}><FAQSectionBlock {...section} /></SectionWrapper>;
    case "newsletter":       return <SectionWrapper section={section}><NewsletterSection {...section} /></SectionWrapper>;
    case "promoBar":         return <SectionWrapper section={section}><PromoBarSection {...section} /></SectionWrapper>;
    case "tabSection":       return <SectionWrapper section={section}><TabSectionBlock {...section} /></SectionWrapper>;
    case "spacer":           return <SpacerBlock {...section} />;
    case "customHtml":       return <SectionWrapper section={section}><CustomHtmlBlock {...section} /></SectionWrapper>;
    case "bannerTitle":      return <SectionWrapper section={section}><BannerTitleSection {...section} /></SectionWrapper>;
    case "trustSection":     return <SectionWrapper section={section}><TrustSection {...section} /></SectionWrapper>;
    default:                 return null;
  }
}

/* ═══════════════════════════════════════
   18. TRUST SECTION — payment methods + trust badges
   Purple gradient card with two stacked rows. Mirrors the
   trust/badge sections common at the bottom of ecommerce pages.
═══════════════════════════════════════ */
function TrustSection({
  paymentTitle = "طرق الدفع المتاحة",
  paymentMethods = [],
  trustBadges = [],
  style = "gradient",
}: {
  paymentTitle?: string;
  paymentMethods?: Array<{ label: string; emoji?: string; image?: { url?: string } }>;
  trustBadges?: Array<{ title: string; description: string; emoji?: string; image?: { url?: string } }>;
  style?: "gradient" | "solid" | "blue" | "pink" | "gold";
}) {
  const bgMap: Record<string, string> = {
    gradient: "bg-gradient-to-br from-[#7C3AED] via-[#8B5CF6] to-[#6366F1]",
    solid:    "bg-[#7C3AED]",
    blue:     "bg-gradient-to-br from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]",
    pink:     "bg-gradient-to-br from-[#EC4899] via-[#F472B6] to-[#A855F7]",
    gold:     "bg-gradient-to-br from-[#F59E0B] via-[#FB923C] to-[#EF4444]",
  };
  const bg = bgMap[style] ?? bgMap.gradient;

  const hasPayment = paymentTitle || paymentMethods.length > 0;
  const hasBadges  = trustBadges.length > 0;
  if (!hasPayment && !hasBadges) return null;

  return (
    <div className={`overflow-hidden rounded-2xl ${bg} p-5 text-white shadow-md md:p-6`} dir="rtl">

      {/* ── Row 1 — Payment methods ─────────────────────────── */}
      {hasPayment && (
        <div className="flex flex-wrap items-center gap-3">
          {paymentTitle && (
            <h3 className="text-sm font-black md:text-base">{paymentTitle}</h3>
          )}
          {paymentMethods.length > 0 && (
            <div className="flex flex-1 flex-wrap items-center gap-2 justify-end">
              {paymentMethods.map((m, i) => (
                <span
                  key={i}
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-bold text-[#5B21B6] shadow-sm"
                >
                  {m.image?.url ? (
                    <Image src={m.image.url} alt="" width={18} height={18} className="h-4 w-auto object-contain" />
                  ) : m.emoji ? (
                    <span className="text-base leading-none">{m.emoji}</span>
                  ) : null}
                  <span>{m.label}</span>
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* divider */}
      {hasPayment && hasBadges && <div className="my-4 h-px bg-white/15" />}

      {/* ── Row 2 — Trust badges ────────────────────────────── */}
      {hasBadges && (
        <div className="grid gap-3 md:grid-cols-2">
          {trustBadges.map((b, i) => (
            <div key={i} className="flex items-center gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15 backdrop-blur">
                {b.image?.url ? (
                  <Image src={b.image.url} alt="" width={20} height={20} className="h-5 w-5 object-contain" />
                ) : (
                  <span className="text-base leading-none">{b.emoji || "⭐"}</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-black leading-tight md:text-base">{b.title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-white/80 md:text-sm">
                  {b.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   17. BANNER TITLE — gradient pill separator
   Drop this between content blocks as a styled visual heading.
   Distinct from each block's own `title` field (which still works
   for in-block headings using the existing .section-title CSS).
═══════════════════════════════════════ */
function BannerTitleSection({
  title,
  emoji,
  showSideIcons = true,
  style = "gradient",
}: {
  title?: string;
  emoji?: string;
  showSideIcons?: boolean;
  style?: "gradient" | "solid" | "blue" | "pink" | "gold";
}) {
  if (!title) return null;

  const bgMap: Record<string, string> = {
    gradient: "bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1]",
    solid:    "bg-[#7C3AED]",
    blue:     "bg-gradient-to-r from-[#3B82F6] via-[#6366F1] to-[#8B5CF6]",
    pink:     "bg-gradient-to-r from-[#EC4899] via-[#F472B6] to-[#A855F7]",
    gold:     "bg-gradient-to-r from-[#F59E0B] via-[#FB923C] to-[#EF4444]",
  };
  const bg = bgMap[style] ?? bgMap.gradient;

  return (
    <div
      className={`flex items-center justify-between gap-4 rounded-2xl px-4 py-3 text-white shadow-md ${bg}`}
      dir="rtl"
    >
      {showSideIcons ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <RefreshCw className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden />
      )}

      <h2 className="flex flex-1 items-center justify-center gap-2 text-base font-black md:text-xl">
        <span>{title}</span>
        {emoji && <span className="text-lg">{emoji}</span>}
      </h2>

      {showSideIcons ? (
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur">
          <RefreshCw className="h-4 w-4 text-white" strokeWidth={2.5} />
        </div>
      ) : (
        <span className="h-9 w-9 shrink-0" aria-hidden />
      )}
    </div>
  );
}

/* ═══════════════════════════════════════
   1. HERO BANNER
═══════════════════════════════════════ */
function HeroBannerSection({ title, subtitle, cta, backgroundImage }: any) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#9333EA] px-10 py-20 text-white md:py-28">
      {backgroundImage?.url && (
        <Image src={backgroundImage.url} alt="" fill className="object-cover opacity-20" />
      )}
      <div className="relative z-10 text-center">
        <h1 className="mx-auto max-w-3xl text-4xl font-black leading-tight md:text-6xl">{title}</h1>
        {subtitle && <p className="mx-auto mt-5 max-w-xl text-xl text-white/80">{subtitle}</p>}
        {cta?.label && (
          <Link href={cta.link} className="mt-10 inline-block rounded-xl bg-white px-10 py-4 text-base font-bold text-[#7C3AED] shadow-lg transition-all hover:bg-[#f5f3ff] hover:shadow-xl">
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   2. MULTI-IMAGE BANNER / SLIDESHOW
═══════════════════════════════════════ */
function MultiImageBanner({ slides, autoplay }: any) {
  const [current, setCurrent] = useState(0);
  const total = slides?.length ?? 0;

  useEffect(() => {
    if (!autoplay || total < 2) return;
    const t = setInterval(() => setCurrent(p => (p + 1) % total), 4000);
    return () => clearInterval(t);
  }, [autoplay, total]);

  if (!total) return null;
  const slide = slides[current];

  return (
    <section className="relative overflow-hidden rounded-3xl shadow-none">
      <div className="relative aspect-[16/6] w-full">
        {slide.image?.url && (
          <Image src={slide.image.url} alt={slide.title ?? ""} fill className="object-cover" />
        )}
        <div className="absolute inset-0 flex flex-col items-end justify-center p-8 text-right text-white md:p-16">
          {slide.title && <h2 className="text-2xl font-black md:text-4xl">{slide.title}</h2>}
          {slide.subtitle && <p className="mt-2 text-sm text-white/80 md:text-base">{slide.subtitle}</p>}
          {slide.ctaLabel && slide.ctaLink && (
            <Link href={slide.ctaLink} className="mt-4 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-2.5 text-sm font-bold text-[#7C3AED] transition-all hover:bg-[#f5f3ff]">
              {slide.ctaLabel} <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>
      {total > 1 && (
        <>
          <button onClick={() => setCurrent(p => (p - 1 + total) % total)} className="absolute right-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white">
            <ArrowRight className="h-4 w-4 text-[#7C3AED]" />
          </button>
          <button onClick={() => setCurrent(p => (p + 1) % total)} className="absolute left-4 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/80 hover:bg-white">
            <ArrowLeft className="h-4 w-4 text-[#7C3AED]" />
          </button>
          <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
            {slides.map((_: any, i: number) => (
              <button key={i} onClick={() => setCurrent(i)} className={`h-2 rounded-full transition-all ${i === current ? "w-6 bg-white" : "w-2 bg-white/50"}`} />
            ))}
          </div>
        </>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   3. FEATURED PRODUCTS
═══════════════════════════════════════ */
const colsClass: Record<string, string> = {
  "2": "grid-cols-2",
  "3": "grid-cols-2 md:grid-cols-3",
  "4": "grid-cols-2 md:grid-cols-3 lg:grid-cols-4",
  "5": "grid-cols-2 md:grid-cols-3 lg:grid-cols-5",
  "6": "grid-cols-2 md:grid-cols-4 lg:grid-cols-6",
};

function FeaturedProductsSection({ title, subtitle, products, titleIcon }: any) {
  // Editors can upload a custom title icon (PNG with transparent bg works best)
  // per block. Falls back to the Sparkles vector when nothing is uploaded.
  const iconUrl = titleIcon?.url as string | undefined;
  const chip = (
    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-white/15 backdrop-blur sm:h-9 sm:w-9" aria-hidden>
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          width={28}
          height={28}
          className="h-5 w-5 object-contain sm:h-6 sm:w-6"
          unoptimized
        />
      ) : (
        <Sparkles className="h-4 w-4 text-white" strokeWidth={2.5} />
      )}
    </span>
  );
  return (
    <section>
      {title && (
        <div
          className="mb-4 flex items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-[#7C3AED] via-[#8B5CF6] to-[#6366F1] px-3 py-1.5 text-white shadow-md sm:px-4 sm:py-3"
          dir="rtl"
        >
          {chip}
          <h2 className="flex flex-1 items-center justify-center gap-2 text-sm font-black sm:text-base md:text-xl">
            <span>{title}</span>
          </h2>
          {chip}
        </div>
      )}
      {subtitle && <p className="mb-4 text-center text-sm text-[#6b7280]">{subtitle}</p>}
      <ProductCarousel>
        {products?.map((product: any) => (
          <div key={product.id} className="w-[170px] shrink-0 sm:w-[280px] lg:w-[300px]">
            <ProductCard product={product} />
          </div>
        ))}
        {/* Trailing "show more" slot — last in DOM order, so it appears on the
            visual LEFT in this dir="rtl" carousel. Renders as a centered pill
            button, not a full card; links to the category that the products
            in this block share (or /products if mixed). */}
        <div className="flex w-[160px] shrink-0 items-center justify-center sm:w-[210px] lg:w-[230px]">
          <Link
            href={showMoreHref(products)}
            className="inline-flex items-center rounded-full border border-[#7C3AED] bg-white px-7 py-2 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-[#7C3AED] hover:text-white sm:text-base"
          >
            عرض المزيد
          </Link>
        </div>
      </ProductCarousel>
    </section>
  );
}

/**
 * Resolve the "show more" target for a Featured Products block:
 *  - If every product in the block belongs to the same category and we
 *    can read its slug from the depth=2 payload, link to /collections/<slug>.
 *  - Otherwise fall back to /products.
 *
 * `category` on a Product is either a string ID (depth=0) or the full
 * Category doc (depth>=1). getHomePage fetches at depth=2 so we expect
 * the full doc in normal operation, but we still handle the ID case to
 * avoid crashing the homepage on a depth misconfiguration.
 */
function showMoreHref(products: any[] | undefined): string {
  if (!products?.length) return "/products";
  const slugs = new Set<string>();
  for (const p of products) {
    const cat = p?.category;
    const slug = cat && typeof cat === "object" ? cat.slug : null;
    if (!slug) return "/products"; // any product without a category → bail
    slugs.add(slug);
    if (slugs.size > 1) return "/products"; // mixed categories → bail
  }
  const [slug] = slugs;
  return slug ? `/collections/${slug}` : "/products";
}


/* ═══════════════════════════════════════
   4. CATEGORY GRID
═══════════════════════════════════════ */
function CategoryGridSection({ title, categories, columns }: any) {
  const cols = colsClass[columns ?? "4"] ?? colsClass["4"];
  return (
    <section>
      <div className="section-title">{title}</div>
      <div className={`grid gap-4 ${cols}`}>
        {categories?.map((cat: any) => (
          <Link key={cat.id} href={`/collections/${cat.slug}`} className="cat-card group">
            {cat.icon?.url ? (
              <div className="relative h-20 w-20 overflow-hidden rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110">
                <Image src={cat.icon.url} alt={cat.nameAr} fill className="object-contain p-2" />
              </div>
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-white shadow-sm text-4xl transition-transform duration-300 group-hover:scale-110">📦</div>
            )}
            <p className="text-base font-bold text-[#1e1b4b]">{cat.nameAr}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   SHARED — zero-gap seamless marquee
   gap=0 makes -50% mathematically exact:
   -50% of (2 copies) = exactly 1 copy → invisible seam.
═══════════════════════════════════════ */
function SeamlessMarquee({
  children,
  itemWidth,
  mobileItemWidth,
  speed = 25,
  pauseOnHover = true,
  gap = 16,
}: {
  children: React.ReactNode[];
  itemWidth: number;
  /** Override item width below 640px. Defaults to itemWidth (no change). */
  mobileItemWidth?: number;
  speed?: number;
  pauseOnHover?: boolean;
  gap?: number;
}) {
  const duration = typeof speed === "number" && speed > 0 ? speed : 25;
  const n = children.length;
  // useId must run on every render — keep above the early return.
  const rawId = useId();
  const id = rawId.replace(/:/g, "");
  if (n === 0) return null;

  // Use the smaller of the two widths for the repeat math so the mobile
  // breakpoint still has enough copies to loop seamlessly.
  const minUnit = Math.min(itemWidth, mobileItemWidth ?? itemWidth) + gap;
  const repeats = Math.max(Math.ceil(5760 / (n * minUnit)), 2);
  const copies = repeats % 2 === 0 ? repeats : repeats + 1;

  const itemClass = `marquee-item-${id}`;
  const track = Array.from({ length: copies }).flatMap((_, ci) =>
    children.map((child, i) => (
      <div key={`${ci}-${i}`} className={itemClass} style={{ flexShrink: 0, marginInlineEnd: gap }}>
        {child}
      </div>
    ))
  );

  // CSS variable + media query so the width swap doesn't need JS or
  // cause hydration mismatch.
  const css = `.${itemClass}{width:${itemWidth}px}` +
    (mobileItemWidth ? `@media(max-width:640px){.${itemClass}{width:${mobileItemWidth}px}}` : "");

  return (
    <div className="overflow-x-clip" style={{ direction: "ltr" }}>
      <style dangerouslySetInnerHTML={{ __html: css }} />
      <div
        style={{
          display: "flex",
          width: "max-content",
          willChange: "transform",
          animation: `seamless-marquee ${duration}s linear infinite`,
        }}
        onMouseEnter={e => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = "paused"; }}
        onMouseLeave={e => { if (pauseOnHover) (e.currentTarget as HTMLElement).style.animationPlayState = "running"; }}
      >
        {track}
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════
   5. CATEGORY BANNERS — seamless marquee
═══════════════════════════════════════ */
function CategoryBannersSection({ title, banners, cardWidth, cardAspectRatio, speed = 25, pauseOnHover }: any) {
  const wMap: Record<string, number> = { xs: 120, sm: 160, md: 220, lg: 280, xl: 360 };
  const mobileMap: Record<string, number> = { xs: 90, sm: 110, md: 140, lg: 170, xl: 200 };
  const wNum = wMap[cardWidth ?? "md"] ?? 220;
  const mNum = mobileMap[cardWidth ?? "md"] ?? 140;
  const ratio = cardAspectRatio ?? "3/4";

  if (!banners?.length) return null;

  const cards = banners.map((b: any, i: number) => {
    const cat = b.category;
    const href = cat?.slug ? `/collections/${cat.slug}` : "#";
    return (
      <Link key={i} href={href} className="group block rounded-2xl overflow-hidden" style={{ width: "100%" }}>
        <div className="relative w-full" style={{ aspectRatio: ratio }}>
          {b.image?.url ? (
            <Image src={b.image.url} alt={cat?.nameAr ?? ""} fill className="object-cover transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#EDE9FE] text-6xl">📦</div>
          )}
        </div>
      </Link>
    );
  });

  return (
    <section className="py-2 sm:py-3">
      {title && <div className="section-title">{title}</div>}
      <SeamlessMarquee itemWidth={wNum} mobileItemWidth={mNum} speed={Number(speed) || 25} pauseOnHover={pauseOnHover !== false}>
        {cards}
      </SeamlessMarquee>
    </section>
  );
}

/* ═══════════════════════════════════════
   6. CATEGORY ROW — seamless marquee
═══════════════════════════════════════ */
function CategoryRowSection({ title, items, iconSize, speed = 25, pauseOnHover }: any) {
  const szMap: Record<string, number> = { sm: 80, md: 112, lg: 144 };
  const mobileMap: Record<string, number> = { sm: 60, md: 80, lg: 96 };
  const szNum = szMap[iconSize ?? "md"] ?? 112;
  const mNum = mobileMap[iconSize ?? "md"] ?? 80;

  if (!items?.length) return null;

  // Height needs to follow the responsive width so icons stay square.
  // We can't put height on the Link inline (different value per breakpoint),
  // so use aspect-square + the marquee's responsive width drives the height.
  const cards = items.map((item: any, i: number) => {
    const sub = item.subcategory;
    const href = sub?.slug ? `/collections/${sub.slug}` : "#";
    return (
      <Link key={i} href={href} className="group relative block aspect-square w-full">
        {item.image?.url ? (
          <Image src={item.image.url} alt={sub?.nameAr ?? ""} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EDE9FE] text-3xl">📦</div>
        )}
      </Link>
    );
  });

  return (
    <section className="py-2 sm:py-3">
      {title && <div className="section-title">{title}</div>}
      <SeamlessMarquee itemWidth={szNum} mobileItemWidth={mNum} speed={Number(speed) || 25} pauseOnHover={pauseOnHover !== false}>
        {cards}
      </SeamlessMarquee>
    </section>
  );
}

/* ═══════════════════════════════════════
   7. IMAGE WITH TEXT
═══════════════════════════════════════ */
function ImageWithTextSection({ image, title, text, ctaLabel, ctaLink, imagePosition }: any) {
  const isRight = imagePosition !== "left";
  return (
    <section className={`flex flex-col gap-8 md:flex-row md:items-center ${isRight ? "" : "md:flex-row-reverse"}`}>
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl md:w-1/2">
        {image?.url && <Image src={image.url} alt={title} fill className="object-cover" />}
        {!image?.url && <div className="flex h-full items-center justify-center bg-[#EDE9FE] text-6xl">🖼️</div>}
      </div>
      <div className="flex flex-1 flex-col gap-4 text-right">
        <h2 className="text-2xl font-black text-[#1e1b4b] md:text-3xl">{title}</h2>
        {text && <p className="text-sm leading-relaxed text-[#6b7280]">{text}</p>}
        {ctaLabel && ctaLink && (
          <Link href={ctaLink} className="brand-btn self-end px-8 py-3">
            {ctaLabel}
          </Link>
        )}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   8. STORE FEATURES / ICONS WITH TEXT
═══════════════════════════════════════ */
function FeatureBlocksSection({ title, items }: any) {
  // Markup mirrors the original Shopify "أيقونات مع نص (4 مميزات)" section:
  // .about__wrapper > .wrapper > .outer__about > .grid__ > .el__ × N.
  // Each .el__ stacks: h6 (heading) → .icons_para (round icon chip) → p (sub).
  // Styles live in storefront/styles/globals.css under the same class names.
  return (
    <section dir="rtl">
      {title && (
        <div className="mb-4 flex justify-center">
          <span className="inline-flex items-center gap-2 rounded-lg bg-[#EDE9FE] px-4 py-1.5 text-base font-black text-[#7C3AED] sm:text-lg">
            {title}
          </span>
        </div>
      )}

      <div className="about__wrapper">
        <div className="wrapper">
          <div className="outer__about">
            <div className="grid__">
              {items?.map((f: any, i: number) => (
                <div key={i} className="el__">
                  <h6>{f.title}</h6>
                  <span className="icons_para icons_para_with_background">
                    {f.icon?.url ? (
                      <Image src={f.icon.url} alt="" width={42} height={42} className="object-contain" />
                    ) : (
                      <span className="text-2xl">⚡</span>
                    )}
                  </span>
                  <p>{f.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. STATS SECTION
═══════════════════════════════════════ */
function StatsSectionBlock({ title, stats }: any) {
  const items = stats || [];
  // Parse each stat value once so we know what to animate and what to
  // preserve as static prefix/suffix text. "150+" → {target:150, suffix:"+"}.
  const parsed = items.map((s: any) => parseStatValue(String(s.value ?? "")));

  const sectionRef = useRef<HTMLDivElement>(null);
  const [counts, setCounts] = useState<number[]>(() => items.map(() => 0));
  const startedRef = useRef(false);

  useEffect(() => {
    if (!sectionRef.current || startedRef.current) return;
    const el = sectionRef.current;
    const start = () => {
      if (startedRef.current) return;
      startedRef.current = true;
      const duration = 1600; // ms — all columns finish together
      const t0 = performance.now();
      let raf = 0;
      const step = (now: number) => {
        const p = Math.min(1, (now - t0) / duration);
        // Ease-out cubic so the numbers feel responsive at start, gentle at end.
        const eased = 1 - Math.pow(1 - p, 3);
        setCounts(parsed.map((d) => Math.round(d.target * eased)));
        if (p < 1) raf = requestAnimationFrame(step);
      };
      raf = requestAnimationFrame(step);
      return () => cancelAnimationFrame(raf);
    };
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) start();
      },
      { threshold: 0.4 }
    );
    io.observe(el);
    return () => io.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!items.length) return null;

  // Markup mirrors the original Shopify section's DOM:
  //   .stats4__wrapper > .stats4__inner > (.stats4__header)? + .stats4__grid > .stat4__item × N
  // CSS variables drive the look so a future Settings global could pipe
  // these through per-instance. Defaults match the source design.
  return (
    <section
      ref={sectionRef}
      className="stats4__wrapper"
      style={{
        // @ts-expect-error CSS variables aren't in the React style type
        "--outer-bg": "transparent",
        "--box-bg": "linear-gradient(135deg, #8B5CF6 0%, #A78BFA 50%, #8B5CF6 100%)",
        "--label": "rgba(255,255,255,0.85)",
        "--divider": "rgba(255,255,255,0.25)",
      }}
      dir="rtl"
    >
      <div className="stats4__inner">
        {title && (
          <div className="stats4__header">
            <h2>{title}</h2>
          </div>
        )}

        <div className="stats4__grid">
          {items.map((s: any, i: number) => {
            const { prefix, suffix } = parsed[i];
            return (
              <div key={i} className="stat4__item">
                {s.emoji && <span className="stat4__emoji">{s.emoji}</span>}
                <div
                  className="stat4__value"
                  style={{ fontFeatureSettings: '"tnum"' }}
                  dir="ltr"
                >
                  {prefix}
                  <span>{counts[i].toLocaleString("en-US")}</span>
                  {suffix}
                </div>
                <div className="stat4__label">{s.label}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/**
 * Pull the integer target out of a stat value like "5+ سنوات" / "+150" /
 * "20,000+" so we can animate it. Everything around the digits is kept
 * verbatim and re-rendered as prefix / suffix so the look stays exact.
 */
function parseStatValue(raw: string): { target: number; prefix: string; suffix: string } {
  const m = raw.match(/[\d،,]+/);
  if (!m) return { target: 0, prefix: "", suffix: raw };
  const digits = m[0].replace(/[,،]/g, "");
  const target = parseInt(digits, 10) || 0;
  const prefix = raw.slice(0, m.index!);
  const suffix = raw.slice(m.index! + m[0].length);
  return { target, prefix, suffix };
}

/* ═══════════════════════════════════════
   10. TESTIMONIALS
═══════════════════════════════════════ */
function TestimonialsSection({ title, items }: any) {
  // Markup mirrors the original Shopify "آراء العملاء (بطاقات)" block:
  // .tst-section > .tst-container > .tst-heading + .tst-grid > .tst-card × N.
  // Each .tst-card has .tst-stars (5 SVGs, filled vs outlined per rating),
  // .tst-quote, and .tst-meta with .tst-name and .tst-date. We keep the
  // scroll-snap slider behavior (1 on mobile, 4 on lg+) requested
  // separately by piping .tst-grid through overflow-x + snap utilities.
  return (
    <section className="tst-section" dir="rtl">
      <div className="tst-container">
        {title && <h2 className="tst-heading">{title || "آراء العملاء"}</h2>}

        <div
          className="tst-grid tst-cols-4 [&::-webkit-scrollbar]:hidden"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {items?.map((t: any, i: number) => {
            const rating = Math.max(0, Math.min(5, Number(t.rating ?? 5)));
            return (
              <article key={i} className="tst-card">
                <div className="tst-stars" aria-label={`${rating} من 5`}>
                  {Array.from({ length: 5 }).map((_, si) => (
                    <svg
                      key={si}
                      viewBox="0 0 24 24"
                      className={`tst-star${si < rating ? " fill" : ""}`}
                    >
                      {si < rating ? (
                        <path d="M12 17.27 18.18 21l-1.64-7.03L22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21z" />
                      ) : (
                        <path d="M22 9.24l-7.19-.62L12 2 9.19 8.62 2 9.24l5.46 4.73L5.82 21 12 17.27 18.18 21l-1.64-7.03L22 9.24zM12 15.4 8.24 17.67l1-4.28L6.5 10.5l4.38-.38L12 6.1l1.12 4.02 4.38.38-2.74 2.89 1 4.28z" />
                      )}
                    </svg>
                  ))}
                </div>

                {t.text && <p className="tst-quote">&ldquo;{t.text}&rdquo;</p>}

                <div className="tst-meta">
                  {t.name && <strong className="tst-name">{t.name}</strong>}
                  {t.date && <span className="tst-date">{t.date}</span>}
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   11. FAQ
═══════════════════════════════════════ */
function FAQSectionBlock({ title, items }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  // Markup mirrors the original Shopify section: <h2 class="faq__title"> +
  // .faq__wrapper > .wrapper > .outer__faq > .elem__faq (.head__ / .content__).
  // Styles live in storefront/app/globals.css under the same class names.
  return (
    <section dir="rtl">
      <h2 className="faq__title">{title || "الأسئلة الشائعة"} 💬</h2>

      <div className="faq__wrapper">
        <div className="wrapper">
          <div className="outer__faq">
            {items?.map((faq: any, i: number) => {
              const isOpen = openIndex === i;
              return (
                <div key={i} className={`elem__faq${isOpen ? " is-open" : ""}`}>
                  <button
                    type="button"
                    className="head__"
                    onClick={() => setOpenIndex(isOpen ? null : i)}
                    aria-expanded={isOpen}
                  >
                    <p>{faq.question}</p>
                    <span aria-hidden>
                      <svg
                        id="Iconly_Bold_Arrow_-_Up_2"
                        xmlns="http://www.w3.org/2000/svg"
                        width="40"
                        height="40"
                        viewBox="0 0 24 24"
                      >
                        <g transform="translate(6 7)">
                          <path d="M7.131.369c.058.057.306.27.51.469a21.69,21.69,0,0,1,4.024,5.8A4.617,4.617,0,0,1,12,7.812a1.933,1.933,0,0,1-.218.9,1.874,1.874,0,0,1-.9.795,9.84,9.84,0,0,1-1.064.256A23.979,23.979,0,0,1,6.008,10a27.724,27.724,0,0,1-3.689-.213A8.495,8.495,0,0,1,.992,9.446,1.785,1.785,0,0,1,0,7.868V7.812A4.879,4.879,0,0,1,.409,6.491,21.69,21.69,0,0,1,4.375.823,5.66,5.66,0,0,1,4.929.341,1.783,1.783,0,0,1,5.993,0,1.875,1.875,0,0,1,7.131.369" fill="#200e32" />
                        </g>
                      </svg>
                    </span>
                  </button>
                  {isOpen && (
                    <div className="content__">
                      <p>{faq.answer}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   12. NEWSLETTER
═══════════════════════════════════════ */
function NewsletterSection({ title, subtitle, placeholder, buttonLabel }: any) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  return (
    <section className="overflow-hidden rounded-2xl bg-[#EDE9FE] px-10 py-16 text-center">
      <h2 className="text-3xl font-black text-[#1e1b4b]">{title || "اشترك في نشرتنا"}</h2>
      {subtitle && <p className="mx-auto mt-3 max-w-lg text-base text-[#6b7280]">{subtitle}</p>}
      {sent ? (
        <p className="mt-6 text-sm font-bold text-[#7C3AED]">✓ تم الاشتراك بنجاح!</p>
      ) : (
        <div className="mx-auto mt-6 flex max-w-sm gap-2">
          <input
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            placeholder={placeholder || "أدخل بريدك الإلكتروني"}
            className="search-input flex-1"
          />
          <button onClick={() => email && setSent(true)} className="brand-btn shrink-0 px-5">
            {buttonLabel || "اشترك"}
          </button>
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   13. PROMO BAR
═══════════════════════════════════════ */
function PromoBarSection({ text, couponCode }: any) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-r from-[#5B21B6] to-[#9333EA] p-8 text-center text-white">
      <p className="text-xl font-bold">{text}</p>
      {couponCode && (
        <div className="mt-4 inline-block rounded-lg border-2 border-dashed border-white/40 px-5 py-2.5 font-mono text-xl font-black tracking-widest">
          {couponCode}
        </div>
      )}
    </section>
  );
}

/* ═══════════════════════════════════════
   14. TAB SECTION (Description + Reviews)
═══════════════════════════════════════ */
function TabSectionBlock({ tabs }: any) {
  const [active, setActive] = useState(0);
  if (!tabs?.length) return null;
  return (
    <section className="rounded-2xl border border-[#e8e4f8] bg-white overflow-hidden">
      <div className="flex border-b border-[#e8e4f8]">
        {tabs.map((tab: any, i: number) => (
          <button
            key={i}
            onClick={() => setActive(i)}
            className={`px-6 py-4 text-sm font-bold transition-colors ${
              active === i
                ? "border-b-2 border-[#7C3AED] text-[#7C3AED]"
                : "text-[#6b7280] hover:text-[#1e1b4b]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="prose prose-sm max-w-none p-6 text-right">
        {/* Rich text content rendered as plain — enhance with actual rich text renderer if needed */}
        <div className="text-sm leading-relaxed text-[#6b7280]">
          {typeof tabs[active]?.content === "string"
            ? tabs[active].content
            : JSON.stringify(tabs[active]?.content)}
        </div>
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   15. SPACER
═══════════════════════════════════════ */
function SpacerBlock({ size }: any) {
  const h: Record<string, string> = { sm: "24px", md: "48px", lg: "80px", xl: "120px" };
  return <div style={{ height: h[size] ?? "48px" }} aria-hidden />;
}

/* ═══════════════════════════════════════
   16. CUSTOM HTML
═══════════════════════════════════════ */
function CustomHtmlBlock({ html }: any) {
  if (!html) return null;
  return <section dangerouslySetInnerHTML={{ __html: html }} />;
}
