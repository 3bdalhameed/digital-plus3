import { notFound } from "next/navigation";
import { getCategoryBySlug, getProducts, getSubcategories } from "@/lib/payload";
import { ProductCard } from "@/components/product/ProductCard";
import Link from "next/link";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug).catch(() => null);
  if (!category) notFound();

  const [products, subcategories] = await Promise.all([
    getProducts({ category: params.slug }).catch(() => ({ docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false })),
    getSubcategories(category.id).catch(() => []),
  ]);

  return (
    <div>
      <h1 className="mb-2 text-2xl font-black text-brand-800">
        {(category as any).nameAr || category.name?.ar}
      </h1>
      {category.description && (
        <p className="mb-8 text-gray-500">{category.description}</p>
      )}

      {subcategories.length > 0 && (
        <div className="mb-8 flex flex-wrap gap-2">
          {subcategories.map((sub: any) => (
            <Link
              key={sub.id}
              href={`/products?category=${params.slug}&subcategory=${sub.slug}`}
              className="rounded-xl bg-white px-4 py-2 text-sm font-medium text-brand-600 shadow-sm transition-colors hover:bg-brand-50"
            >
              {sub.nameAr}
            </Link>
          ))}
        </div>
      )}

      {products.docs.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.docs.map((product: any) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📦</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">لا توجد منتجات في هذا التصنيف</h2>
        </div>
      )}
    </div>
  );
}
