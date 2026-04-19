"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import type { Product } from "@my-store/types";

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem);
  const imageUrl = product.images?.[0]?.image?.url;
  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const discountPct = hasDiscount
    ? Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)
    : 0;

  return (
    <div className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#e8e4f8] bg-white transition-all duration-300 hover:border-[#c4b5fd] hover:shadow-[0_8px_32px_rgba(124,58,237,0.14)] hover:-translate-y-1">

      {/* Discount badge */}
      {hasDiscount && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-2.5 py-1 text-xs font-black text-white shadow-[0_2px_8px_rgba(124,58,237,0.4)]">
          -{discountPct}%
        </div>
      )}

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden bg-[#f5f3ff]">
          <div className="absolute inset-0 bg-gradient-to-br from-[rgba(124,58,237,0.04)] to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name?.ar ?? product.name?.en ?? ""}
              fill
              className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#EDE9FE] text-4xl">
                📦
              </div>
            </div>
          )}
        </div>
      </Link>

      {/* Divider */}
      <div className="h-px w-full bg-gradient-to-r from-transparent via-[#ddd6fe] to-transparent" />

      {/* Info */}
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-bold leading-snug text-[#1e1b4b] transition-colors group-hover:text-[#7C3AED]">
            {product.name?.ar ?? product.name?.en ?? ""}
          </h3>
        </Link>

        <div className="mt-auto pt-4">
          {/* Price */}
          <div className="flex items-end gap-2">
            <span className="text-xl font-black text-[#7C3AED]">
              {formatPrice(product.price, product.currency)}
            </span>
            {hasDiscount && (
              <span className="mb-0.5 text-xs text-[#9ca3af] line-through">
                {formatPrice(product.comparePrice!, product.currency)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => addItem(product)}
            className="brand-btn mt-3 w-full gap-2 py-2.5 text-xs"
          >
            <ShoppingCart className="h-4 w-4" />
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
