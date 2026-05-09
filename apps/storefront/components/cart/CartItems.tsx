"use client";

import Image from "next/image";
import Link from "next/link";
import { Trash2, Plus, Minus } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";

export function CartItems() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } =
    useCartStore();

  if (items.length === 0) {
    return (
      <div className="brand-card py-16 text-center">
        <span className="text-6xl">🛒</span>
        <h2 className="mt-4 text-xl font-bold text-brand-800">
          سلة التسوق فارغة
        </h2>
        <p className="mt-2 text-gray-500">ابدأ بإضافة منتجات إلى سلتك</p>
        <Link href="/products" className="brand-btn mt-6 inline-block">
          تصفح المنتجات
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const imageUrl = item.product.images?.[0]?.image?.url;
        return (
          <div
            key={item.product.id}
            className="brand-card flex items-center gap-4"
          >
            {/* Image */}
            <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                  fill
                  className="object-contain p-2"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-2xl">
                  📦
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1">
              <Link
                href={`/products/${item.product.slug}`}
                className="text-sm font-bold text-brand-800 hover:text-brand-500"
              >
                {(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
              </Link>
              <p className="mt-1 text-sm font-semibold text-brand-600">
                {formatPrice(item.product.price, item.product.currency)}
              </p>
            </div>

            {/* Quantity */}
            <div className="flex items-center gap-2 rounded-xl border border-brand-100 p-1">
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity - 1)
                }
                className="rounded-lg p-1 hover:bg-brand-50"
              >
                <Minus className="h-4 w-4 text-brand-600" />
              </button>
              <span className="min-w-[2rem] text-center text-sm font-bold text-brand-800">
                {item.quantity}
              </span>
              <button
                onClick={() =>
                  updateQuantity(item.product.id, item.quantity + 1)
                }
                className="rounded-lg p-1 hover:bg-brand-50"
              >
                <Plus className="h-4 w-4 text-brand-600" />
              </button>
            </div>

            {/* Subtotal */}
            <div className="min-w-[5rem] text-left">
              <span className="text-sm font-bold text-brand-600">
                {formatPrice(
                  item.product.price * item.quantity,
                  item.product.currency
                )}
              </span>
            </div>

            {/* Remove */}
            <button
              onClick={() => removeItem(item.product.id)}
              className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        );
      })}

      {/* Summary */}
      <div className="brand-card">
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-800">المجموع</span>
          <span className="text-2xl font-extrabold text-brand-600">
            {formatPrice(totalPrice())}
          </span>
        </div>
        <div className="mt-6 flex gap-3">
          <Link href="/checkout" className="brand-btn flex-1 text-center">
            إتمام الشراء
          </Link>
          <button
            onClick={clearCart}
            className="brand-btn-outline px-4 text-sm"
          >
            إفراغ السلة
          </button>
        </div>
      </div>
    </div>
  );
}
