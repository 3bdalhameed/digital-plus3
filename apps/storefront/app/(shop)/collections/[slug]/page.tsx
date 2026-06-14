import { notFound } from "next/navigation";
import { draftMode } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import {
  getCategoryBySlug,
  getSubcategoryBySlug,
  getProducts,
  getSubcategories,
} from "@/lib/payload";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 60;

/**
 * Unified "collection" page handling BOTH categories AND subcategories.
 *
 *   /collections/<category-slug>     →  category page (subcategories grid + products)
 *   /collections/<subcategory-slug>  →  subcategory page (filtered products)
 *
 * Categories take precedence on slug collision (they're the primary nav).
 * Falls back to subcategory if no category matches that slug.
 */
export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: { slug: string };
  searchParams: { page?: string };
}) {
  const page = searchParams?.page ? parseInt(searchParams.page, 10) : 1;

  // Reading draftMode opts this page out of ISR caching when an
  // editor is previewing the collection from the Payload admin —
  // so they always see the latest unpublished edits.
  const { isEnabled: isPreview } = draftMode();
  void isPreview;

  /* Try category first */
  const category = await getCategoryBySlug(params.slug).catch(() => null);
  if (category) {
    const [products, subcategories] = await Promise.all([
      getProducts({ category: params.slug, page }).catch(() => ({
        docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false,
      })),
      getSubcategories(params.slug).catch(() => []),
    ]);

    const title = (category as any).nameAr || (category as any).name?.ar || category.slug;

    return (
      <div>
        <h1 className="mb-1 text-xl font-black text-brand-800">{title}</h1>
        {category.description && (
          <p className="mb-8 text-gray-500">{category.description}</p>
        )}

        {subcategories.length > 0 && (
          <div className="mb-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
            <h2 className="mb-4 text-center text-sm font-bold text-brand-600">
              الأقسام الفرعية
            </h2>
            <div className="flex flex-wrap items-start justify-center gap-6">
              {subcategories.map((sub: any) => {
                const iconUrl = sub.icon?.url;
                return (
                  <Link
                    key={sub.id}
                    href={`/collections/${sub.slug}`}
                    className="group flex w-24 flex-col items-center gap-2"
                  >
                    <div className="relative h-20 w-20 transition-transform group-hover:scale-105">
                      {iconUrl ? (
                        <Image src={iconUrl} alt={sub.nameAr} fill className="object-contain" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-2xl font-black text-white shadow-md">
                          {sub.nameAr?.[0] ?? "•"}
                        </div>
                      )}
                    </div>
                    <span className="text-center text-xs font-medium text-brand-800 line-clamp-2">
                      {sub.nameAr}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <ProductsGrid products={products} emptyMessage="لا توجد منتجات في هذا التصنيف" />
        <Pagination data={products} basePath={`/collections/${params.slug}`} />
      </div>
    );
  }

  /* Fall through to subcategory */
  const subcategory = await getSubcategoryBySlug(params.slug).catch(() => null);
  if (subcategory) {
    const products = await getProducts({ subcategory: params.slug, page }).catch(() => ({
      docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false,
    }));

    const title = (subcategory as any).nameAr || (subcategory as any).name?.ar || subcategory.slug;
    const parent = (subcategory as any).category;
    const parentSlug =
      parent && typeof parent === "object" ? parent.slug : undefined;
    const parentLabel =
      parent && typeof parent === "object" ? parent.nameAr || parent.name?.ar : undefined;

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

        <ProductsGrid products={products} emptyMessage="لا توجد منتجات في هذا القسم" />
        <Pagination data={products} basePath={`/collections/${params.slug}`} />
      </div>
    );
  }

  notFound();
}

/* ────────────────────────────────────────────────────────── */

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
}: {
  data: { totalPages: number; page: number; hasNextPage: boolean; hasPrevPage: boolean };
  basePath: string;
}) {
  if (data.totalPages <= 1) return null;
  return (
    <div className="mt-8 flex items-center justify-center gap-2">
      {data.hasPrevPage && (
        <Link href={`${basePath}?page=${data.page - 1}`} className="brand-btn-outline text-xs">
          السابق
        </Link>
      )}
      <span className="px-4 text-sm text-brand-600">
        صفحة {data.page} من {data.totalPages}
      </span>
      {data.hasNextPage && (
        <Link href={`${basePath}?page=${data.page + 1}`} className="brand-btn-outline text-xs">
          التالي
        </Link>
      )}
    </div>
  );
}
