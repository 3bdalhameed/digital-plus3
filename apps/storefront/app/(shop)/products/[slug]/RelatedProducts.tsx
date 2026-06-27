"use client";

import { useRef } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/product/ProductCard";
import type { Product } from "@my-store/types";

/**
 * Horizontal scroll-snap row of related products with thin grey arrow
 * controls. Mirrors the styling of the homepage's Featured Products
 * carousel so it visually belongs on a product page.
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

  return (
    <section dir="rtl" className="mt-10">
      <h2 className="mb-5 text-right text-xl font-black text-[#7C3AED] sm:text-2xl md:text-3xl">
        {title}
      </h2>

      <div className="relative">
        <div
          ref={trackRef}
          className="flex gap-2 overflow-x-auto pt-2 pb-3 scroll-smooth"
          style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
        >
          {products.map((p) => (
            <div key={(p as any).id} className="w-[170px] shrink-0 sm:w-[220px] lg:w-[240px]">
              <ProductCard product={p} />
            </div>
          ))}
        </div>

        <button
          onClick={() => scroll("right")}
          className="absolute -right-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 translate-x-1/2 items-center justify-center text-[#9ca3af] transition-colors hover:text-[#1e1b4b] sm:flex"
          aria-label="السابق"
        >
          <ArrowRight className="h-6 w-6" strokeWidth={1.5} />
        </button>
        <button
          onClick={() => scroll("left")}
          className="absolute -left-3 top-1/2 z-10 hidden h-10 w-10 -translate-y-1/2 -translate-x-1/2 items-center justify-center text-[#9ca3af] transition-colors hover:text-[#1e1b4b] sm:flex"
          aria-label="التالي"
        >
          <ArrowLeft className="h-6 w-6" strokeWidth={1.5} />
        </button>
      </div>
    </section>
  );
}
