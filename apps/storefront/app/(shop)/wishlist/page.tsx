"use client";

import Link from "@/components/ui/link";
import { Heart, Trash2 } from "lucide-react";
import { useWishlistStore } from "@/lib/wishlist-store";
import { ProductCard } from "@/components/product/ProductCard";
import { useT } from "@/lib/i18n";

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
  const { t, isEn, dir } = useT();

  const heading = isEn ? "Wishlist" : "المفضلة";
  const emptyHint = isEn
    ? "You haven't added any products yet"
    : "لم تضف أي منتج بعد";
  const countLabel = isEn
    ? `${items.length.toLocaleString("en-US")} saved ${items.length === 1 ? "item" : "items"}`
    : `${items.length.toLocaleString("en-US")} ${items.length === 1 ? "منتج" : "منتجات"} محفوظة`;
  const clearConfirm = isEn
    ? "Empty your wishlist?"
    : "هل تريد إفراغ قائمة المفضلة؟";
  const clearBtn = isEn ? "Empty list" : "إفراغ القائمة";

  return (
    <div dir={dir}>
      <header className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED]">
            <Heart className="h-5 w-5 fill-[#7C3AED]" strokeWidth={0} />
          </span>
          <div>
            <h1 className="text-xl font-black text-[#1e1b4b] sm:text-2xl">{heading}</h1>
            <p className="text-sm text-[#6b7280]">
              {items.length === 0 ? emptyHint : countLabel}
            </p>
          </div>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={() => {
              if (confirm(clearConfirm)) clear();
            }}
            className="inline-flex items-center gap-2 rounded-xl border border-[#FECACA] bg-white px-4 py-2 text-sm font-bold text-[#B91C1C] transition hover:bg-[#FEE2E2]"
          >
            <Trash2 className="h-4 w-4" />
            {clearBtn}
          </button>
        )}
      </header>

      {items.length === 0 ? <EmptyState /> : (
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
  const { t, isEn } = useT();
  const emptyTitle = isEn ? "Your wishlist is empty" : "قائمة المفضلة فارغة";
  const emptyBody = isEn
    ? "Tap the heart icon on any product to save it here. Your wishlist stays in your browser until you return."
    : "اضغط على أيقونة القلب على أي منتج لإضافته إلى المفضلة هنا. ستظل المنتجات محفوظة في متصفحك حتى تعود.";

  return (
    <div className="brand-card flex flex-col items-center gap-4 px-6 py-16 text-center">
      <span className="flex h-20 w-20 items-center justify-center rounded-full bg-[#EDE9FE]">
        <Heart className="h-10 w-10 text-[#7C3AED]" strokeWidth={1.5} />
      </span>
      <h2 className="text-lg font-black text-[#1e1b4b] sm:text-xl">{emptyTitle}</h2>
      <p className="max-w-sm text-sm text-[#6b7280] sm:text-base">{emptyBody}</p>
      <Link
        href="/products"
        className="mt-2 inline-flex items-center gap-2 rounded-xl bg-[#7C3AED] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#6D28D9]"
      >
        {t("browseProducts")}
      </Link>
    </div>
  );
}
