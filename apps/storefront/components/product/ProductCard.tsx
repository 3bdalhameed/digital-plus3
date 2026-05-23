"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLocaleStore } from "@/lib/locale-store";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@my-store/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const { lang, currency, rates } = useLocaleStore();

  const p = product as any;
  const nameAr = p.nameAr ?? product.name?.ar;
  const nameEn = p.nameEn ?? product.name?.en;
  const displayName = lang === "en" && nameEn ? nameEn : nameAr;

  const imageUrl = product.images?.[0]?.image?.url;
  const categoryIconUrl = (product.category as any)?.icon?.url;
  const subcategoryNameAr = (product.subcategory as any)?.nameAr;
  const subcategoryNameEn = (product.subcategory as any)?.nameEn;
  const subcategoryLabel =
    lang === "en" && subcategoryNameEn ? subcategoryNameEn : subcategoryNameAr;

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm border border-gray-100 transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">

      {/* ── Image area ── */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-[1] overflow-hidden bg-gray-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? ""}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-5xl">📦</div>
          )}

          {/* Discount badge — bottom left */}
          {hasDiscount && (
            <div className="absolute bottom-2 left-2 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-2.5 py-0.5 text-xs font-black text-white shadow">
              -{discountPct}%
            </div>
          )}
        </div>
      </Link>

      {/* ── Content ── */}
      <div className="flex flex-1 flex-col p-3 gap-2">

        {/* Name + subcategory */}
        <Link href={`/products/${product.slug}`} className="flex-1">
          <h3
            className="line-clamp-2 text-sm font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#7C3AED]"
            dir="rtl"
          >
            {displayName}
          </h3>
          {subcategoryLabel && (
            <p className="mt-0.5 text-xs text-[#7C3AED] font-medium" dir="rtl">
              {subcategoryLabel}
            </p>
          )}
        </Link>

        <div className="flex flex-col gap-2">
          {/* Price */}
          <div className="flex items-center gap-2 justify-end" dir="rtl">
            <span className="text-base font-black text-gray-900">
              {formatPrice(product.price, product.currency, currency, rates)}
            </span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">
                {formatPrice(product.comparePrice!, product.currency, currency, rates)}
              </span>
            )}
          </div>

          {/* Add to cart button */}
          <button
            onClick={() => addItem(product)}
            className="flex w-full items-center justify-between gap-2 rounded-xl bg-[#7C3AED] px-4 py-2.5 text-sm font-bold text-white transition-all hover:bg-[#6D28D9] active:scale-95"
            dir="rtl"
          >
            <ShoppingCart className="h-4 w-4 flex-shrink-0" />
            <span>{lang === "en" ? "Add to Cart" : "أضف إلى السلة"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
