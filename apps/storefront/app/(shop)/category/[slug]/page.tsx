import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getCategoryBySlug, getProducts, getSubcategories } from "@/lib/payload";
import { ProductCard } from "@/components/product/ProductCard";

export const revalidate = 60;

export default async function CategoryPage({ params }: { params: { slug: string } }) {
  const category = await getCategoryBySlug(params.slug).catch(() => null);
  if (!category) notFound();

  const [products, subcategories] = await Promise.all([
    getProducts({ category: params.slug }).catch(() => ({ docs: [], totalPages: 0, page: 1, totalDocs: 0, hasNextPage: false, hasPrevPage: false })),
    getSubcategories(params.slug).catch(() => []),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-xl font-black text-brand-800">
        {(category as any).nameAr || category.name?.ar}
      </h1>
      {category.description && (
        <p className="mb-8 text-gray-500">{category.description}</p>
      )}

      {subcategories.length > 0 && (
        <div className="mb-8 rounded-3xl border border-brand-100 bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-center text-sm font-bold text-brand-600">الأقسام الفرعية</h2>
          <div className="flex flex-wrap items-start justify-center gap-6">
            {subcategories.map((sub: any) => {
              const iconUrl = sub.icon?.url;
              return (
                <Link
                  key={sub.id}
                  href={`/products?category=${params.slug}&subcategory=${sub.slug}`}
                  className="group flex w-20 flex-col items-center gap-2"
                >
                  <div className="relative h-16 w-16 overflow-hidden rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 shadow-md transition-transform group-hover:scale-105">
                    {iconUrl ? (
                      <Image src={iconUrl} alt={sub.nameAr} fill className="object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-2xl font-black text-white">
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
