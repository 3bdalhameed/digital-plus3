"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ChevronDown, ChevronUp, Zap } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import { useState } from "react";
import type { HomePageSection } from "@my-store/types";

// ---------------------
// Section Router
// ---------------------

export function SectionRenderer({ section }: { section: HomePageSection }) {
  if (!section.enabled) return null;

  switch (section.blockType) {
    case "heroBanner":
      return <HeroBannerSection {...section} />;
    case "categoryGrid":
      return <CategoryGridSection {...section} />;
    case "featuredProducts":
      return <FeaturedProductsSection {...section} />;
    case "promoBar":
      return <PromoBarSection {...section} />;
    case "testimonials":
      return <TestimonialsSection {...section} />;
    case "faqSection":
      return <FAQSectionBlock {...section} />;
    case "featureBlocks":
      return <FeatureBlocksSection {...section} />;
    default:
      return null;
  }
}

// ---------------------
// Hero Banner
// ---------------------

function HeroBannerSection({
  title,
  subtitle,
  cta,
  backgroundImage,
}: any) {
  return (
    <section className="relative overflow-hidden rounded-3xl bg-brand-gradient px-8 py-16 text-center text-white md:py-24">
      {backgroundImage?.url && (
        <Image
          src={backgroundImage.url}
          alt=""
          fill
          className="object-cover opacity-20"
        />
      )}
      <div className="relative z-10">
        <h1 className="mx-auto max-w-3xl text-3xl font-black leading-tight md:text-5xl">
          {title}
        </h1>
        {subtitle && (
          <p className="mx-auto mt-4 max-w-xl text-lg text-white/80">
            {subtitle}
          </p>
        )}
        {cta && (
          <Link
            href={cta.link}
            className="mt-8 inline-block rounded-xl bg-white px-8 py-3 font-bold text-brand-600 transition-all hover:scale-105 hover:shadow-lg"
          >
            {cta.label}
          </Link>
        )}
      </div>
    </section>
  );
}

// ---------------------
// Category Grid
// ---------------------

function CategoryGridSection({ title, categories }: any) {
  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-black text-brand-800">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories?.map((cat: any) => (
          <Link key={cat.id} href={`/category/${cat.slug}`}>
            <div className="category-card transition-transform hover:scale-[1.02]">
              {cat.icon?.url && (
                <div className="relative h-16 w-16">
                  <Image
                    src={cat.icon.url}
                    alt={cat.nameAr}
                    fill
                    className="object-contain"
                  />
                </div>
              )}
              <h3 className="category-name">{cat.nameAr}</h3>
              {cat.description && (
                <p className="category-desc line-clamp-2">{cat.description}</p>
              )}
              {cat.brandLogos?.length > 0 && (
                <div className="mt-3 flex items-center justify-center gap-2">
                  {cat.brandLogos.slice(0, 4).map((bl: any, i: number) => (
                    <div key={i} className="relative h-6 w-6 opacity-50">
                      {bl.logo?.url && (
                        <Image
                          src={bl.logo.url}
                          alt=""
                          fill
                          className="object-contain"
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

// ---------------------
// Featured Products
// ---------------------

function FeaturedProductsSection({ title, products }: any) {
  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-black text-brand-800">
        {title}
      </h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products?.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}

// ---------------------
// Promo Bar
// ---------------------

function PromoBarSection({ text, couponCode }: any) {
  return (
    <section className="overflow-hidden rounded-2xl bg-brand-gradient-dark p-6 text-center text-white">
      <p className="text-lg font-bold">{text}</p>
      {couponCode && (
        <div className="mt-3 inline-block rounded-lg border-2 border-dashed border-white/40 px-4 py-2 font-mono text-lg font-black tracking-wider">
          {couponCode}
        </div>
      )}
    </section>
  );
}

// ---------------------
// Testimonials
// ---------------------

function TestimonialsSection({ items }: any) {
  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-black text-brand-800">
        آراء عملائنا
      </h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((t: any, i: number) => (
          <div key={i} className="brand-card">
            <div className="mb-3 flex gap-0.5">
              {Array.from({ length: 5 }).map((_, si) => (
                <Star
                  key={si}
                  className={`h-4 w-4 ${
                    si < t.rating
                      ? "fill-yellow-400 text-yellow-400"
                      : "text-gray-200"
                  }`}
                />
              ))}
            </div>
            <p className="text-sm leading-relaxed text-gray-600">{t.text}</p>
            <p className="mt-3 text-sm font-bold text-brand-600">{t.name}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------
// FAQ
// ---------------------

function FAQSectionBlock({ items }: any) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section>
      <h2 className="mb-8 text-center text-2xl font-black text-brand-800">
        الأسئلة الشائعة
      </h2>
      <div className="mx-auto max-w-2xl space-y-3">
        {items?.map((faq: any, i: number) => (
          <div key={i} className="brand-card !p-0 overflow-hidden">
            <button
              onClick={() => setOpenIndex(openIndex === i ? null : i)}
              className="flex w-full items-center justify-between p-5 text-right"
            >
              <span className="text-sm font-bold text-brand-800">
                {faq.question}
              </span>
              {openIndex === i ? (
                <ChevronUp className="h-4 w-4 shrink-0 text-brand-400" />
              ) : (
                <ChevronDown className="h-4 w-4 shrink-0 text-brand-400" />
              )}
            </button>
            {openIndex === i && (
              <div className="border-t border-brand-50 bg-brand-50/50 p-5">
                <p className="text-sm leading-relaxed text-gray-600">
                  {faq.answer}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  );
}

// ---------------------
// Feature Blocks
// ---------------------

function FeatureBlocksSection({ items }: any) {
  return (
    <section>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {items?.map((f: any, i: number) => (
          <div key={i} className="brand-card flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-brand-100">
              {f.icon?.url ? (
                <Image
                  src={f.icon.url}
                  alt=""
                  width={24}
                  height={24}
                  className="object-contain"
                />
              ) : (
                <Zap className="h-5 w-5 text-brand-500" />
              )}
            </div>
            <div>
              <h3 className="text-sm font-bold text-brand-800">{f.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-500">
                {f.description}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
