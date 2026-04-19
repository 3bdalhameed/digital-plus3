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

  return (
    <div className="brand-card group relative flex flex-col overflow-hidden">
      {/* Compare price badge */}
      {product.comparePrice && product.comparePrice > product.price && (
        <div className="absolute left-3 top-3 z-10 rounded-full bg-red-500 px-3 py-1 text-xs font-bold text-white">
          خصم{" "}
          {Math.round(
            ((product.comparePrice - product.price) / product.comparePrice) * 100
          )}
          %
        </div>
      )}

      {/* Image */}
      <Link href={`/products/${product.slug}`} className="block">
        <div className="relative aspect-square overflow-hidden rounded-xl bg-brand-50">
          {imageUrl ? (
            <Image
              src={imageUrl}
              alt={product.name.ar}
              fill
              className="object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-4xl text-brand-300">📦</span>
            </div>
          )}
        </div>
      </Link>

      {/* Info */}
      <div className="mt-4 flex flex-1 flex-col">
        <Link href={`/products/${product.slug}`}>
          <h3 className="line-clamp-2 text-sm font-bold text-brand-800 transition-colors group-hover:text-brand-500">
            {product.name.ar}
          </h3>
        </Link>

        <div className="mt-auto pt-4">
          {/* Price */}
          <div className="flex items-center gap-2">
            <span className="text-lg font-extrabold text-brand-600">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-sm text-gray-400 line-through">
                {formatPrice(product.comparePrice, product.currency)}
              </span>
            )}
          </div>

          {/* Add to cart */}
          <button
            onClick={() => addItem(product)}
            className="brand-btn mt-3 w-full gap-2 text-xs"
          >
            <ShoppingCart className="h-4 w-4" />
            أضف للسلة
          </button>
        </div>
      </div>
    </div>
  );
}
