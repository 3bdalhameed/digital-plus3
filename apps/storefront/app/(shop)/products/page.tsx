import { getProducts, getCategories } from "@/lib/payload";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export const metadata = { title: "المنتجات" };
export const revalidate = 60;

interface Props {
  searchParams: {
    /** Kept for legacy URLs (?category=...) — new flow uses /collections/<slug> */
    category?: string;
    /** Kept for legacy URLs — new flow uses /collections/<slug> */
    subcategory?: string;
    type?: string;
    page?: string;
    q?: string;
  };
}

export default async function ProductsPage({ searchParams }: Props) {
  const [productsData, categories] = await Promise.all([
    getProducts({
      category: searchParams.category,
      subcategory: searchParams.subcategory,
      type: searchParams.type,
      q: searchParams.q,
      page: searchParams.page ? parseInt(searchParams.page) : 1,
    }).catch(() => ({ docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false })),
    getCategories().catch(() => []),
  ]);

  // Build a persistent query string for pagination links (preserves all active filters)
  const baseParams = new URLSearchParams();
  if (searchParams.category) baseParams.set("category", searchParams.category);
  if (searchParams.subcategory) baseParams.set("subcategory", searchParams.subcategory);
  if (searchParams.q) baseParams.set("q", searchParams.q);
  const baseQuery = baseParams.toString();

  return (
    <div>
      <div className="mb-4 flex items-center justify-between gap-4">
        <h1 className="text-2xl font-black text-brand-800">
          {searchParams.q ? `نتائج البحث: "${searchParams.q}"` : "المنتجات"}
        </h1>
        {searchParams.q && (
          <Link href="/products" className="text-sm text-brand-500 hover:underline">
            إلغاء البحث
          </Link>
        )}
      </div>

      {/* Category Filter — hidden during search */}
      {!searchParams.q && (
        <div className="mb-8 flex flex-wrap gap-2">
          <Link
            href="/products"
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              !searchParams.category
                ? "bg-brand-500 text-white"
                : "bg-white text-brand-600 hover:bg-brand-50"
            }`}
          >
            الكل
          </Link>
          {categories.map((cat: any) => (
            <Link
              key={cat.id}
              href={`/collections/${cat.slug}`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-brand-600 transition-colors hover:bg-brand-50"
            >
              {cat.nameAr}
            </Link>
          ))}
        </div>
      )}

      {/* Products Grid */}
      {productsData.docs.length > 0 ? (
        <>
          {searchParams.q && (
            <p className="mb-4 text-sm text-gray-500">
              {productsData.totalDocs} نتيجة
            </p>
          )}
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productsData.docs.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </>
      ) : (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📦</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">
            {searchParams.q ? "لا توجد نتائج لبحثك" : "لا توجد منتجات حالياً"}
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {searchParams.q
              ? "جرب كلمة بحث مختلفة"
              : searchParams.category
              ? "جرب تصنيفاً آخر"
              : "ستتوفر المنتجات قريباً"}
          </p>
        </div>
      )}

      {/* Pagination */}
      {productsData.totalPages > 1 && (
        <div className="mt-8 flex items-center justify-center gap-2">
          {productsData.hasPrevPage && (
            <Link
              href={`/products?page=${productsData.page - 1}${baseQuery ? `&${baseQuery}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              السابق
            </Link>
          )}
          <span className="px-4 text-sm text-brand-600">
            صفحة {productsData.page} من {productsData.totalPages}
          </span>
          {productsData.hasNextPage && (
            <Link
              href={`/products?page=${productsData.page + 1}${baseQuery ? `&${baseQuery}` : ""}`}
              className="brand-btn-outline text-xs"
            >
              التالي
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
