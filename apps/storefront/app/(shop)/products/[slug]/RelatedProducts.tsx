"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight, Sparkles } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@my-store/types";

/**
 * Related-products carousel styled to match the homepage's Featured
 * Products block: purple gradient title bar (with icon chips on both
 * ends), inset scroll rail, and grey arrow chevrons that sit outside
 * the padding. Sizes and structure mirror FeaturedProductsSection.
 */
export function RelatedProducts({ products, title = "منتجات ذات صلة" }: { products: Product[]; title?: string }) {
  const trackRef = useRef<HTMLDivElement>(null);

  if (!products.length) return null;

  const scroll = (dir: "left" | "right") => {
    const el = trackRef.current;
    if (!el) return;
    const cardW = (el.firstChild as HTMLElement)?.offsetWidth ?? 240;
    el.scrollBy({ left: dir === "left" ? -(cardW + 8) : (cardW + 8), behavior: "smooth" });
  };

  const chip = (
    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-white/15 backdrop-blur sm:h-7 sm:w-7" aria-hidden>
      <Sparkles className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />
    </span>
  );

  return (
    <section dir="rtl" className="mt-10">
      {/* Gradient title bar (same recipe as Featured Products) */}
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

      {/* Inset carousel (matches Featured Products' px-2/sm-6/lg-10) */}
      <div className="px-2 sm:px-6 lg:px-10">
        <div className="relative">
          <div
            ref={trackRef}
            className="flex gap-2 overflow-x-auto pt-2 pb-3 scroll-smooth"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {products.map((p) => (
              <div key={(p as any).id} className="w-[170px] shrink-0 sm:w-[280px] lg:w-[300px]">
                <ProductCard product={p} />
              </div>
            ))}
          </div>

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
      </div>
    </section>
  );
}
