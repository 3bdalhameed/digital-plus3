"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ChevronDown, ChevronUp, Zap, ArrowLeft, ArrowRight, RefreshCw } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useState, useEffect, useRef } from "react";
import type { HomePageSection } from "@my-store/types";

// ── Horizontal product carousel ─────────────────────────────────
function ProductCarousel({ children }: { children: React.ReactNode }) {
  const trackRef = useRef<HTMLDivElement>(null);

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = (el.firstChild as HTMLElement)?.offsetWidth ?? 260;
    el.scrollBy({ left: dir === "left" ? -(cardW + 16) : (cardW + 16), behavior: "smooth" });
  };

  return (
    <div className="relative group/carousel">
      {/* Left arrow */}
      <button
        onClick={() => scroll("right")}
        className="absolute right-0 top-1/2 z-10 -translate-y-1/2 translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#e8e4f8] shadow-md text-[#7C3AED] opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-[#EDE9FE]"
        aria-label="السابق"
      >
        <ArrowRight className="h-5 w-5" />
      </button>

      {/* Track */}
      <div
        ref={trackRef}
        className="flex gap-4 overflow-x-auto pt-2 pb-3 scroll-smooth"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
      >
        {children}
      </div>

      {/* Right arrow */}
      <button
        onClick={() => scroll("left")}
        className="absolute left-0 top-1/2 z-10 -translate-y-1/2 -translate-x-1/2 flex h-10 w-10 items-center justify-center rounded-full bg-white border border-[#e8e4f8] shadow-md text-[#7C3AED] opacity-0 group-hover/carousel:opacity-100 transition-opacity hover:bg-[#EDE9FE]"
        aria-label="التالي"
      >
        <ArrowLeft className="h-5 w-5" />
      </button>
    </div>
  );
}

// ── Layout helpers ──────────────────────────────────────────────
const widthClass: Record<string, string> = {
  sm:   "max-w-2xl mx-auto",
  md:   "max-w-4xl mx-auto",
  lg:   "max-w-6xl mx-auto",
  xl:   "max-w-7xl mx-auto",
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

function FeaturedProductsSection({ title, subtitle, products }: any) {
  return (
    <section>
      <div className="mb-6 text-center">
        <div className="section-title">{title}</div>
        {subtitle && <p className="mt-1 text-sm text-[#6b7280]">{subtitle}</p>}
      </div>
      <ProductCarousel>
        {products?.map((product: any) => (
          <div key={product.id} className="w-[260px] shrink-0 sm:w-[280px] lg:w-[300px]">
            <ProductCard product={product} />
          </div>
        ))}
      </ProductCarousel>
    </section>
  );
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
  speed = 25,
  pauseOnHover = true,
  gap = 16,
}: {
  children: React.ReactNode[];
  itemWidth: number;
  speed?: number;
  pauseOnHover?: boolean;
  gap?: number;
}) {
  const duration = typeof speed === "number" && speed > 0 ? speed : 25;
  const n = children.length;
  if (n === 0) return null;

  // Each wrapper carries the gap as trailing margin, so its "unit width" is fixed
  // and -50% still lands on an exact copy boundary.
  const unit = itemWidth + gap;
  const repeats = Math.max(Math.ceil(5760 / (n * unit)), 2);
  const copies = repeats % 2 === 0 ? repeats : repeats + 1;

  const track = Array.from({ length: copies }).flatMap((_, ci) =>
    children.map((child, i) => (
      <div key={`${ci}-${i}`} style={{ width: itemWidth, flexShrink: 0, marginInlineEnd: gap }}>
        {child}
      </div>
    ))
  );

  return (
    <div className="overflow-x-clip" style={{ direction: "ltr" }}>
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
  const wNum = wMap[cardWidth ?? "md"] ?? 220;
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
    <section className="py-8">
      {title && <div className="section-title">{title}</div>}
      <SeamlessMarquee itemWidth={wNum} speed={Number(speed) || 25} pauseOnHover={pauseOnHover !== false}>
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
  const szNum = szMap[iconSize ?? "md"] ?? 112;

  if (!items?.length) return null;

  const cards = items.map((item: any, i: number) => {
    const sub = item.subcategory;
    const href = sub?.slug ? `/collections/${sub.slug}` : "#";
    return (
      <Link key={i} href={href} className="group relative block" style={{ width: "100%", height: szNum }}>
        {item.image?.url ? (
          <Image src={item.image.url} alt={sub?.nameAr ?? ""} fill className="object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-[#EDE9FE] text-3xl">📦</div>
        )}
      </Link>
    );
  });

  return (
    <section className="py-8">
      {title && <div className="section-title">{title}</div>}
      <SeamlessMarquee itemWidth={szNum} speed={Number(speed) || 25} pauseOnHover={pauseOnHover !== false}>
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
  return (
    <section>
      {title && <div className="section-title">{title}</div>}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {items?.map((f: any, i: number) => (
          <div key={i} className="brand-card flex items-start gap-5">
            <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#EDE9FE]">
              {f.icon?.url ? (
                <Image src={f.icon.url} alt="" width={28} height={28} className="object-contain" />
              ) : (
                <span className="text-3xl">{f.emoji || "⚡"}</span>
              )}
            </div>
            <div>
              <h3 className="text-base font-bold text-[#1e1b4b]">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-[#6b7280]">{f.description}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   9. STATS SECTION
═══════════════════════════════════════ */
function StatsSectionBlock({ title, stats }: any) {
  return (
    <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#5B21B6] via-[#7C3AED] to-[#9333EA] px-8 py-14">
      {title && <div className="mb-10 text-center text-2xl font-black text-white">{title}</div>}
      <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
        {stats?.map((s: any, i: number) => (
          <div key={i} className="text-center">
            {s.emoji && <div className="mb-2 text-4xl">{s.emoji}</div>}
            <div className="text-4xl font-black text-white md:text-5xl">{s.value}</div>
            <div className="mt-2 text-base text-[#ddd6fe]">{s.label}</div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   10. TESTIMONIALS
═══════════════════════════════════════ */
function TestimonialsSection({ title, items }: any) {
  return (
    <section>
      <div className="section-title">{title || "آراء عملائنا"}</div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((t: any, i: number) => (
          <div key={i} className="brand-card">
            <div className="mb-3 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star key={si} className={`h-5 w-5 ${si < t.rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
              ))}
            </div>
            <p className="text-base leading-relaxed text-[#6b7280]">"{t.text}"</p>
            <div className="mt-4 flex items-center gap-3">
              {t.avatar?.url ? (
                <div className="relative h-11 w-11 overflow-hidden rounded-full">
                  <Image src={t.avatar.url} alt={t.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#EDE9FE] text-base font-black text-[#7C3AED]">
                  {t.name?.[0]}
                </div>
              )}
              <p className="text-base font-bold text-[#1e1b4b]">{t.name}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

/* ═══════════════════════════════════════
   11. FAQ
═══════════════════════════════════════ */
function FAQSectionBlock({ title, items }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  return (
    <section>
      <div className="section-title">{title || "الأسئلة الشائعة"}</div>
      <div className="mx-auto max-w-2xl space-y-3">
        {items?.map((faq: any, i: number) => (
          <div key={i} className="overflow-hidden rounded-2xl border border-[#e8e4f8] bg-white">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between p-6 text-right"
            >
              <span className="text-base font-bold text-[#1e1b4b]">{faq.question}</span>
              {openIndex === i
                ? <ChevronUp className="h-5 w-5 shrink-0 text-[#7C3AED]" />
                : <ChevronDown className="h-5 w-5 shrink-0 text-[#7C3AED]" />
              }
            </button>
            {openIndex === i && (
              <div className="border-t border-[#f3f0ff] bg-[#faf9ff] p-6">
                <p className="text-base leading-relaxed text-[#6b7280]">{faq.answer}</p>
              </div>
            )}
          </div>
        ))}
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
