"use client";

import Link from "@/components/ui/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { ProductCard } from "@/components/product/ProductCard";

/**
 * المفضلة / Wishlist page.
 *
 * Reads from the localStorage-backed wishlist store. Pure client-side --
 * no server fetch -- so it loads instantly and stays in sync with the
 * heart toggle on every ProductCard.
 */
export default function WishlistPage() {
  const items = useWishlistStore((s) => s.items);
  const clear = useWishlistStore((s) => s.clear);

  return (
    <div dir="rtl">
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED]">
            <Heart className="h-5 w-5 fill-[#7C3AED]" strokeWidth={0} />
          </span>
          <div>
            <h1 className="text-xl font-black text-[#1e1b4b] sm:text-2xl">المفضلة</h1>
            <p className="text-sm text-[#6b7280]">
              {items.length === 0
                ? "لم تضف أي منتج بعد"
                : `${items.length.toLocaleString("en-US")} ${items.length === 1 ? "منتج" : "منتجات"} محفوظة`}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm("هل تريد إفراغ قائمة المفضلة؟")) clear();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FECACA] bg-white px-4 py-2 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
          >
            <Trash2 className="h-4 w-4" />
            إفراغ القائمة
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {items.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="brand-card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EDE9FE]">
        <Heart className="h-10 w-10 text-[#7C3AED]" strokeWidth={1.5} />
      </span>
      <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">قائمة المفضلة فارغة</h2>
      <p className="max-w-sm text-sm text-[#6b7280] sm:text-base">
        اضغط على أيقونة القلب على أي منتج لإضافته إلى المفضلة هنا. ستظل المنتجات محفوظة في متصفحك حتى تعود.
      </p>
      <Link
        href="/products"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
      >
        تصفح المنتجات
      </Link>
    </div>
  );
}
