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
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border-2 border-[#7C3AED] bg-[#eaeaff] shadow-[0_2px_8px_rgba(124,58,237,0.12)] transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">

      {/* ── Image area with corner badges ── */}
      <Link href={`/products/${product.slug}`} className="relative block">
        <div className="relative aspect-square overflow-hidden bg-gradient-to-br from-[#F5F3FF] to-[#EDE9FE]">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={displayName ?? ""}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl opacity-30">📦</div>
          )}

          {/* Top-right corner — Arabic subcategory / account-type badge */}
          {subcategoryLabel && (
            <div className="absolute top-1.5 right-1.5 rounded-md bg-white/95 px-1.5 py-0.5 text-[9px] font-bold text-[#1e1b4b] shadow-sm backdrop-blur sm:top-2 sm:right-2 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[11px]" dir="rtl">
              {subcategoryLabel}
            </div>
          )}

          {/* Top-left corner — Latin platform tag (subcategory English name or product type) */}
          {(subcategoryNameEn || typeLabel(product.type)) && (
            <div className="absolute top-1.5 left-1.5 rounded-md bg-[#1e1b4b]/90 px-1.5 py-0.5 text-[9px] font-black uppercase tracking-wider text-white shadow-sm backdrop-blur sm:top-2 sm:left-2 sm:rounded-lg sm:px-2.5 sm:py-1 sm:text-[10px]">
              {subcategoryNameEn || typeLabel(product.type)}
            </div>
          )}

          {/* Discount badge — bottom-left (corner) */}
          {hasDiscount && (
            <div className="absolute bottom-1.5 left-1.5 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-1.5 py-0.5 text-[10px] font-black text-white shadow sm:bottom-2 sm:left-2 sm:px-2.5 sm:text-xs">
              -{discountPct}%
            </div>
          )}
        </div>
      </Link>

      {/* ── Content — centered ── */}
      <div className="flex flex-1 flex-col items-center gap-1.5 p-2 sm:gap-2.5 sm:p-3">
        {/* Title — centered */}
        <Link href={`/products/${product.slug}`} className="w-full">
          <h3
            className="line-clamp-2 min-h-[2.4em] text-center text-xs font-bold leading-snug text-gray-900 transition-colors group-hover:text-[#7C3AED] sm:min-h-[2.6em] sm:text-sm"
            dir="rtl"
          >
            {displayName}
          </h3>
        </Link>

        {/* Price — centered stack: current price big purple, compare price below struck-through */}
        <div className="flex flex-col items-center gap-0.5" dir="ltr">
          <span className="text-base font-black text-[#7C3AED] sm:text-lg" style={{ fontFeatureSettings: '"tnum"' }}>
            {formatPrice(product.price, product.currency, currency, rates)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] text-gray-400 line-through sm:text-xs" style={{ fontFeatureSettings: '"tnum"' }}>
              {formatPrice(product.comparePrice!, product.currency, currency, rates)}
            </span>
          )}
        </div>

        {/* Add-to-cart button — full-width purple */}
        <button
          onClick={() => addItem(product)}
          className="mt-auto flex w-full items-center justify-center gap-1.5 rounded-lg bg-[#7C3AED] px-2 py-1.5 text-[11px] font-bold text-white transition-all hover:bg-[#6D28D9] hover:shadow-md active:scale-95 sm:gap-2.5 sm:rounded-xl sm:px-4 sm:py-3 sm:text-sm"
          dir="rtl"
        >
          <ShoppingCart className="h-3.5 w-3.5 flex-shrink-0 sm:h-5 sm:w-5" />
          <span>{lang === "en" ? "Add to Cart" : "أضف إلى السلة"}</span>
        </button>
      </div>
    </div>
  );
}

/**
 * Map product.type → a short Latin label for the top-left corner badge.
 * Falls back to "" so the badge doesn't render if we don't have a sensible label.
 */
function typeLabel(type?: string): string {
  switch (type) {
    case "software_subscription": return "APP";
    case "license_key":           return "LICENSE";
    case "gaming_card":           return "GAME";
    case "ai_subscription":       return "AI";
    case "invitation":            return "INVITE";
    default:                      return "";
  }
}
