"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { ProductCard } from "@/components/product/ProductCard";
import { useT } from "@/lib/i18n";

/**
 * Client wrapper for the /collections/[slug] page. Parent server
 * component fetches category / subcategory / products and hands
 * them in as props; this component picks the right localized labels
 * from useT so switching the locale modal to English actually
 * flips the whole page (subcategory heading, empty state, pagination
 * labels) -- the parent's dir stays neutral.
 *
 * The `variant` prop selects between the two shapes the page renders:
 *   - "category":    hero title + subcategory grid + products
 *   - "subcategory": breadcrumb (parent → current) + products
 */

type ProductsResponse = {
  docs: any[];
  totalPages: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export function CollectionView(props:
  | {
      variant: "category";
      slug: string;
      category: any;
      subcategories: any[];
      products: ProductsResponse;
    }
  | {
      variant: "subcategory";
      slug: string;
      subcategory: any;
      products: ProductsResponse;
    }
) {
  const { isEn } = useT();

  const pickName = (obj: any, fallback = "") => {
    if (!obj) return fallback;
    if (isEn) return obj.nameEn || obj.name?.en || obj.nameAr || obj.name?.ar || fallback;
    return obj.nameAr || obj.name?.ar || obj.nameEn || obj.name?.en || fallback;
  };

  const L = {
    subcategoriesHeading: isEn ? "Subcategories"                              : "الأقسام الفرعية",
    emptyInCategory:      isEn ? "No products in this category yet."          : "لا توجد منتجات في هذا التصنيف",
    emptyInSubcategory:   isEn ? "No products in this section yet."           : "لا توجد منتجات في هذا القسم",
    prevPage:             isEn ? "Previous"                                   : "السابق",
    nextPage:             isEn ? "Next"                                       : "التالي",
    pageOf:               (p: number, t: number) => isEn ? `Page ${p} of ${t}` : `صفحة ${p} من ${t}`,
  };

  if (props.variant === "category") {
    const { category, subcategories, products, slug } = props;
    const title = pickName(category, slug);
    return (
      <div>
        <h1 className="mb-1 text-xl font-black text-brand-800">{title}</h1>
        {category.description && (
          <p className="mb-8 text-gray-500">{category.description}</p>
        )}

        {subcategories.length > 0 && (
          <div className="mb-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-center text-sm font-bold text-brand-600">
              {L.subcategoriesHeading}
            </h2>
            <div className="flex flex-wrap items-start justify-center gap-8 sm:gap-10">
              {subcategories.map((sub: any) => {
                const iconUrl = sub.icon?.url;
                const label = pickName(sub);
                return (
                  <Link
                    key={sub.id}
                    href={`/collections/${sub.slug}`}
                    className="group flex w-40 flex-col items-center gap-3 sm:w-48"
                  >
                    <div className="relative h-36 w-36 transition-transform group-hover:scale-105 sm:h-44 sm:w-44">
                      {iconUrl ? (
                        <Image src={iconUrl} alt={label} fill className="object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-4xl font-black text-white shadow-md">
                          {label?.[0] ?? "•"}
                        </div>
                      )}
                    </div>
                    <span className="text-center text-base font-medium text-brand-800 line-clamp-2 sm:text-lg">
                      {label}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <ProductsGrid products={products} emptyMessage={L.emptyInCategory} />
        <Pagination data={products} basePath={`/collections/${slug}`} L={L} />
      </div>
    );
  }

  const { subcategory, products, slug } = props;
  const title = pickName(subcategory, slug);
  const parent = subcategory.category;
  const parentSlug = parent && typeof parent === "object" ? parent.slug : undefined;
  const parentLabel = parent && typeof parent === "object" ? pickName(parent) : undefined;

  return (
    <div>
      {parentSlug && parentLabel && (
        <nav className="mb-3 text-sm text-brand-500">
          <Link href={`/collections/${parentSlug}`} className="hover:text-brand-700">
            {parentLabel}
          </Link>
          <span className="mx-2 text-brand-300">›</span>
          <span className="text-brand-800">{title}</span>
        </nav>
      )}
      <h1 className="mb-8 text-xl font-black text-brand-800">{title}</h1>

      <ProductsGrid products={products} emptyMessage={L.emptyInSubcategory} />
      <Pagination data={products} basePath={`/collections/${slug}`} L={L} />
    </div>
  );
}

function ProductsGrid({
  products,
  emptyMessage,
}: {
  products: { docs: any[] };
  emptyMessage: string;
}) {
  if (products.docs.length === 0) {
    return (
      <div className="brand-card py-16 text-center">
        <span className="text-5xl">📦</span>
        <h2 className="mt-4 text-lg font-bold text-brand-800">{emptyMessage}</h2>
      </div>
    );
  }
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
      {products.docs.map((product: any) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}

function Pagination({
  data,
  basePath,
  L,
}: {
  data: { totalPages: number; page: number; hasNextPage: boolean; hasPrevPage: boolean };
  basePath: string;
  L: { prevPage: string; nextPage: string; pageOf: (p: number, t: number) => string };
}) {
  if (data.totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {data.hasPrevPage && (
        <Link href={`${basePath}?page=${data.page - 1}`} className="brand-btn-outline text-xs">
          {L.prevPage}
        </Link>
      )}
      <span className="px-4 text-sm text-brand-600">
        {L.pageOf(data.page, data.totalPages)}
      </span>
      {data.hasNextPage && (
        <Link href={`${basePath}?page=${data.page + 1}`} className="brand-btn-outline text-xs">
          {L.nextPage}
        </Link>
      )}
    </div>
  );
}
