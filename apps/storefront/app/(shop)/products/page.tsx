import type { Metadata } from 'next'
import { getProducts, getCategories } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { CategoryCard } from '@/components/product/CategoryCard'

export const metadata: Metadata = {
  title: 'جميع المنتجات',
  description: 'تصفح جميع المنتجات الرقمية',
}

interface SearchParams {
  category?: string
  subcategory?: string
  page?: string
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const page = Number(searchParams.page || 1)

  const [productsData, categoriesData] = await Promise.all([
    getProducts({
      page,
      limit: 12,
      category: searchParams.category,
      subcategory: searchParams.subcategory,
    }).catch(() => ({ docs: [], totalDocs: 0, totalPages: 0 })),
    getCategories().catch(() => ({ docs: [] })),
  ]) as [any, any]

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-primary-dark mb-2">
          {searchParams.category
            ? categoriesData.docs.find((c: any) => c.slug === searchParams.category)?.name_ar || 'المنتجات'
            : 'جميع المنتجات'}
        </h1>
        <p className="text-gray-500">
          {productsData.totalDocs || productsData.docs?.length || 0} منتج متاح
        </p>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar filters */}
        <aside className="w-full md:w-64 shrink-0">
          <div className="card-purple p-4">
            <h3 className="font-bold text-primary-dark mb-4">التصنيفات</h3>
            <div className="space-y-2">
              <a
                href="/products"
                className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                  !searchParams.category
                    ? 'bg-primary text-white'
                    : 'text-gray-600 hover:bg-purple-50'
                }`}
              >
                الكل
              </a>
              {categoriesData.docs?.map((cat: any) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`block px-3 py-2 rounded-lg text-sm transition-colors ${
                    searchParams.category === cat.slug
                      ? 'bg-primary text-white'
                      : 'text-gray-600 hover:bg-purple-50'
                  }`}
                >
                  {cat.name_ar}
                </a>
              ))}
            </div>
          </div>
        </aside>

        {/* Products grid */}
        <div className="flex-1">
          {productsData.docs?.length > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {productsData.docs.map((product: any) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {/* Pagination */}
              {productsData.totalPages > 1 && (
                <div className="flex justify-center gap-2 mt-10">
                  {Array.from({ length: productsData.totalPages }, (_, i) => (
                    <a
                      key={i}
                      href={`/products?page=${i + 1}${searchParams.category ? `&category=${searchParams.category}` : ''}`}
                      className={`w-10 h-10 flex items-center justify-center rounded-lg font-medium transition-colors ${
                        page === i + 1
                          ? 'bg-primary text-white'
                          : 'bg-white text-primary border border-purple-200 hover:bg-purple-50'
                      }`}
                    >
                      {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-bold text-gray-500">لا توجد منتجات</h3>
              <p className="text-gray-400 mt-2">جرب تصنيفاً آخر أو تحقق لاحقاً</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
