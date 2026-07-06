"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ChevronDown, ChevronUp, ArrowLeft, ArrowRight, Sparkles, ShieldCheck, User as UserIcon, CreditCard, Hourglass } from "lucide-react";
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

      {/* Thin grey arrow nav — desktop only. Click hit-area is generous
          (40px square) while the icon stays small and light so it reads as
          a hint, not a heavy nav button. Sits outside the carousel padding
          so it doesn't crowd the first/last card. */}
      <button
        onClick={() => scroll("right")}
        className="absolute -right-6 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center text-[#9ca3af] transition-colors hover:text-[#1e1b4b] sm:flex lg:-right-10"
        aria-label="السابق"
      >
        <ArrowRight className="h-6 w-6" strokeWidth={1.5} />
      </button>
      <button
        onClick={() => scroll("left")}
        className="absolute -left-6 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 items-center justify-center text-[#9ca3af] transition-colors hover:text-[#1e1b4b] sm:flex lg:-left-10"
        aria-label="التالي"
      >
        <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
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
    // "bannerTitle" and "trustSection" cases removed -- the matching CMS
    // block schemas were reverted during the production incident, so these
    // values can never appear in section.blockType. Component bodies kept
    // below in case the schema gets reintroduced.
    default:                 return null;
  }
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

function FeaturedProductsSection({ title, subtitle, products, titleIcon, showMoreSubcategory }: any) {
  // Editors can upload a custom title icon (PNG with transparent bg works best)
  // per block. Falls back to the Sparkles vector when nothing is uploaded.
  const iconUrl = titleIcon?.url as string | undefined;
  // Chip is intentionally sized to match the target bar height. Bumping
  // py on the bar itself does nothing while the chip stays taller than
  // the padding + text combined -- shrink both together to move the bar.
  const chip = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur sm:h-7 sm:w-7" aria-hidden>
      {iconUrl ? (
        <Image
          src={iconUrl}
          alt=""
          width={20}
          height={20}
          className="h-4 w-4 object-contain sm:h-5 sm:w-5"
          unoptimized
        />
      ) : (
        <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
      )}
    </span>
  );
  return (
    <section>
      {title && (
        <div
          className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-gradient-to-r from-[#702dff] to-[#a77fff] px-3 py-1.5 text-white shadow-[0_10px_25px_rgba(112,45,255,0.35)] ring-1 ring-white/10 sm:px-4 sm:py-2"
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
      {/* Inset the carousel (cards + side arrows) from the section edges so
          they sit narrower than the title bar above. The title bar still
          spans the page width to match other sections. */}
      <div className="px-2 sm:px-6 lg:px-10">
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
              href={showMoreHref(products, showMoreSubcategory)}
              className="inline-flex items-center rounded-full border border-[#7C3AED] bg-white px-7 py-2 text-sm font-bold text-[#7C3AED] transition-colors hover:bg-[#7C3AED] hover:text-white sm:text-base"
            >
              عرض المزيد
            </Link>
          </div>
        </ProductCarousel>
      </div>
    </section>
  );
}

/**
 * Resolve the "show more" target for a Featured Products block.
 * Priority:
 *   1. Explicit `showMoreSubcategory` relationship picked in the CMS
 *      → /collections/<subcategory.slug>. Most precise, and editors can
 *      point the button at a subcategory that isn't represented in the
 *      products array (e.g. a curated row of bestsellers from across a
 *      subcategory).
 *   2. Otherwise, if every product in the block belongs to the same
 *      category and we can read its slug from the depth=2 payload,
 *      link to /collections/<category.slug>.
 *   3. Otherwise fall back to /products.
 *
 * `subcategory` / `category` on a Product is either a string/number ID
 * (depth=0) or the full doc (depth>=1). getHomePage fetches at depth=2
 * so the full doc is expected, but the ID branch is kept to be safe.
 */
function showMoreHref(products: any[] | undefined, explicitSubcategory?: any): string {
  // 1. Explicit CMS override beats auto-derivation.
  if (explicitSubcategory && typeof explicitSubcategory === "object" && explicitSubcategory.slug) {
    return `/collections/${explicitSubcategory.slug}`;
  }
  if (!products?.length) return "/products";
  // 2. Auto-derive from a shared category across all products.
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
      <div className={`grid gap-6 sm:gap-8 ${cols}`}>
        {categories?.map((cat: any) => (
          <Link key={cat.id} href={`/collections/${cat.slug}`} className="cat-card group">
            {cat.icon?.url ? (
              <div className="relative h-36 w-36 overflow-hidden rounded-2xl bg-white shadow-sm transition-transform duration-300 group-hover:scale-110 sm:h-44 sm:w-44 lg:h-52 lg:w-52">
                <Image src={cat.icon.url} alt={cat.nameAr} fill className="object-contain p-3" />
              </div>
            ) : (
              <div className="flex h-36 w-36 items-center justify-center rounded-2xl bg-white shadow-sm text-6xl transition-transform duration-300 group-hover:scale-110 sm:h-44 sm:w-44 lg:h-52 lg:w-52">📦</div>
            )}
            <p className="text-base font-bold text-[#1e1b4b] sm:text-lg lg:text-xl">{cat.nameAr}</p>
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
  reverse = false,
}: {
  children: React.ReactNode[];
  itemWidth: number;
  /** Override item width below 640px. Defaults to itemWidth (no change). */
  mobileItemWidth?: number;
  speed?: number;
  pauseOnHover?: boolean;
  gap?: number;
  /** Flip the marquee's scroll direction without touching the keyframes. */
  reverse?: boolean;
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
          animationDirection: reverse ? "reverse" : "normal",
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
  // Only three tiers in the CMS now: small / big / very big.
  // xs + xl entries stay for back-compat with any block saved before the
  // field was simplified -- they map to the nearest new tier.
  const wMap: Record<string, number> = { xs: 260, sm: 260, md: 360, lg: 460, xl: 460 };
  const mobileMap: Record<string, number> = { xs: 200, sm: 200, md: 260, lg: 320, xl: 320 };
  const wNum = wMap[cardWidth ?? "md"] ?? 360;
  const mNum = mobileMap[cardWidth ?? "md"] ?? 260;
  // 3:4 portrait ratio matches the full-frame illustration banners which
  // are noticeably taller than wide (see the reference designs).
  const ratio = cardAspectRatio ?? "3/4";

  if (!banners?.length) return null;

  const cards = banners.map((b: any, i: number) => {
    const cat = b.category;
    const href = cat?.slug ? `/collections/${cat.slug}` : "#";
    return (
      <Link key={i} href={href} className="group block rounded-2xl overflow-hidden" style={{ width: "100%" }}>
        <div className="relative w-full" style={{ aspectRatio: ratio }}>
          {b.image?.url ? (
            // object-contain (not cover) so the whole illustration is visible
            // — these banners ship as full-frame artwork that already includes
            // the card background + text, so cropping chops off content.
            <Image src={b.image.url} alt={cat?.nameAr ?? ""} fill className="object-contain transition-transform duration-500 group-hover:scale-105" />
          ) : (
            <div className="flex h-full items-center justify-center bg-[#EDE9FE] text-6xl">📦</div>
          )}
        </div>
      </Link>
    );
  });

  return (
    <section className="py-2 sm:py-2">
      {title && <div className="section-title">{title}</div>}
      {/* Tight 8px gap -- reference designs sit the cards almost against
          each other so the marquee reads as a single band of artwork. */}
      <SeamlessMarquee
        itemWidth={wNum}
        mobileItemWidth={mNum}
        gap={8}
        speed={Number(speed) || 25}
        pauseOnHover={pauseOnHover !== false}
        reverse
      >
        {cards}
      </SeamlessMarquee>
    </section>
  );
}

/* ═══════════════════════════════════════
   6. CATEGORY ROW — seamless marquee
═══════════════════════════════════════ */
function CategoryRowSection({ title, items, iconSize, speed = 25, pauseOnHover }: any) {
  // Sized to match the larger category cards above. Each tier still maps
  // to the same CMS option name (sm/md/lg) so editors don't need to re-pick.
  const szMap: Record<string, number> = { sm: 140, md: 200, lg: 260 };
  const mobileMap: Record<string, number> = { sm: 100, md: 150, lg: 200 };
  const szNum = szMap[iconSize ?? "md"] ?? 200;
  const mNum = mobileMap[iconSize ?? "md"] ?? 150;

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
      <SeamlessMarquee itemWidth={szNum} mobileItemWidth={mNum} speed={Number(speed) || 25} pauseOnHover={pauseOnHover !== false} reverse>
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
// Default icon set for Feature Blocks when no media is uploaded. Indexed by
// position: 1st cell gets the shield, 2nd a person, etc. -- matches the
// "trust / support / payment / fast delivery" rhythm of the source design.
const FEATURE_FALLBACK_ICONS = [ShieldCheck, UserIcon, CreditCard, Hourglass];

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
              {items?.map((f: any, i: number) => {
                const Fallback = FEATURE_FALLBACK_ICONS[i % FEATURE_FALLBACK_ICONS.length];
                return (
                  <div key={i} className="el__">
                    <h6>{f.title}</h6>
                    <span className="icons_para icons_para_with_background">
                      {f.icon?.url ? (
                        <Image src={f.icon.url} alt="" width={42} height={42} className="object-contain" />
                      ) : (
                        <Fallback className="h-8 w-8" strokeWidth={2} />
                      )}
                    </span>
                    <p>{f.description}</p>
                  </div>
                );
              })}
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
        setCounts(parsed.map((d: { target: number }) => Math.round(d.target * eased)));
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
        // Outer: deep two-tone purple that holds the header + inner card.
        "--outer-bg": "linear-gradient(90deg, #5B21B6 0%, #7C3AED 50%, #A78BFA 100%)",
        // Inner: a lighter tinted overlay so the stats card reads as a
        // separate surface floating on top of the outer band.
        "--box-bg": "rgba(255,255,255,0.10)",
        "--label": "rgba(255,255,255,0.85)",
        "--divider": "rgba(255,255,255,0.30)",
      }}
      dir="rtl"
    >
      {/* Title sits at the top of the OUTER container (not the inner card),
          matching the reference where the heading floats above the stats
          band with only outer-container padding around it. */}
      {title && (
        <div className="stats4__header">
          <h2>{title}</h2>
        </div>
      )}

      <div className="stats4__inner">
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
