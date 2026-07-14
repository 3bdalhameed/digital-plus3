"use client";

import Link from "@/components/ui/link";
import { ProductCard } from "@/components/product/ProductCard";
import { useT } from "@/lib/i18n";

interface Props {
  docs: any[];
  totalPages: number;
  page: number;
  totalDocs: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
  categories: any[];
  searchQuery: string | undefined;
  categoryFilter: string | undefined;
  baseQuery: string;
}

export function ProductsView({
  docs, totalPages, page, totalDocs, hasNextPage, hasPrevPage,
  categories, searchQuery, categoryFilter, baseQuery,
}: Props) {
  const { t, dir, isEn, lang } = useT();

  const searchResultsHeading =
    searchQuery ? (isEn ? `Search results: "${searchQuery}"` : `نتائج البحث: "${searchQuery}"`) : t("productsTitle");
  const clearSearch = isEn ? "Clear search" : "إلغاء البحث";
  const allLabel    = isEn ? "All" : "الكل";
  const resultsCount = isEn ? `${totalDocs} results` : `${totalDocs} نتيجة`;
  const emptyTitle  = searchQuery
    ? (isEn ? "No results for your search" : "لا توجد نتائج لبحثك")
    : (isEn ? "No products yet" : "لا توجد منتجات حالياً");
  const emptyHint   = searchQuery
    ? (isEn ? "Try a different search term" : "جرب كلمة بحث مختلفة")
    : categoryFilter
      ? (isEn ? "Try a different category" : "جرب تصنيفاً آخر")
      : (isEn ? "Products will be available soon" : "ستتوفر المنتجات قريباً");
  const prev        = isEn ? "Previous" : "السابق";
  const next        = isEn ? "Next" : "التالي";
  const pageOfLabel = isEn ? `Page ${page} of ${totalPages}` : `صفحة ${page} من ${totalPages}`;

  const catName = (cat: any) =>
    lang === "en" && cat.nameEn ? cat.nameEn : cat.nameAr;

  return (
    <div dir={dir}>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-brand-800">{searchResultsHeading}</h1>
        {searchQuery && (
          <Link href="/products" className="text-sm text-brand-500 hover:underline">
            {clearSearch}
          </Link>
        )}
      </div>

      {/* Category Filter — hidden during search */}
      {!searchQuery && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              !categoryFilter
                ? "bg-brand-500 text-white"
                : "bg-white text-brand-600 hover:bg-brand-50"
            }`}
          >
            {allLabel}
          </Link>
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              {catName(cat)}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {docs.length > 0 ? (
        <>
          {searchQuery && <p className="mb-4 text-sm text-gray-500">{resultsCount}</p>}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {docs.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📦</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">{emptyTitle}</h2>
          <p className="mt-2 text-sm text-gray-500">{emptyHint}</p>
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {hasPrevPage && (
            <Link
              href={`/products?page=${page - 1}${baseQuery ? `&${baseQuery}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              {prev}
            </Link>
          )}
          <span className="px-4 text-sm text-brand-600">{pageOfLabel}</span>
          {hasNextPage && (
            <Link
              href={`/products?page=${page + 1}${baseQuery ? `&${baseQuery}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              {next}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
