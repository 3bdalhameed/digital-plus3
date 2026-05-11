import { Suspense } from "react";
import { getProducts, getCategories, getSubcategories } from "@/lib/payload";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export const metadata = { title: "المنتجات" };
export const revalidate = 60;

interface Props {
  searchParams: { category?: string; subcategory?: string; type?: string; page?: string };
}

export default async function ProductsPage({ searchParams }: Props) {
  const categories = await getCategories().catch(() => []);

  const matchedCat = categories.find((c: any) => c.slug === searchParams.category);
  const categoryId = matchedCat ? Number((matchedCat as any).id) : undefined;

  const productsData = await getProducts({
    category: searchParams.category,
    ...(categoryId && !isNaN(categoryId) ? { categoryId } : {}),
    subcategory: searchParams.subcategory,
    type: searchParams.type,
    page: searchParams.page ? parseInt(searchParams.page) : 1,
  }).catch(() => ({ docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false }));

  return (
    <div>
      <h1 className="mb-4 text-2xl font-black text-brand-800">المنتجات</h1>

      {/* Category Filter */}
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
            href={`/products?category=${cat.slug}`}
            className={`rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              searchParams.category === cat.slug
                ? "bg-brand-500 text-white"
                : "bg-white text-brand-600 hover:bg-brand-50"
            }`}
          >
            {cat.nameAr}
          </Link>
        ))}
      </div>

      {/* Products Grid */}
      {productsData.docs.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {productsData.docs.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📦</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">
            لا توجد منتجات حالياً
          </h2>
          <p className="mt-2 text-sm text-gray-500">
            {searchParams.category
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
              href={`/products?page=${productsData.page - 1}${searchParams.category ? `&category=${searchParams.category}` : ""}`}
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
              href={`/products?page=${productsData.page + 1}${searchParams.category ? `&category=${searchParams.category}` : ""}`}
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
