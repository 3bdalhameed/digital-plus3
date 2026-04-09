import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Image from 'next/image'
import { getCategoryBySlug, getProducts } from '@/lib/payload'
import { ProductCard } from '@/components/product/ProductCard'
import { getCategoryName } from '@/lib/utils'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const category = await getCategoryBySlug(params.slug).catch(() => null)
  if (!category) return {}
  return { title: getCategoryName(category) }
}

export default async function CategoryPage({ params }: Props) {
  const [category, productsData] = await Promise.all([
    getCategoryBySlug(params.slug).catch(() => null),
    getProducts({ category: params.slug, limit: 24 }).catch(() => ({ docs: [] })),
  ]) as [any, any]

  if (!category) notFound()

  return (
    <div>
      {/* Category header */}
      <div className="gradient-header text-white py-12 px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-6">
          {category.icon?.url && (
            <div className="w-20 h-20 relative shrink-0">
              <Image
                src={category.icon.url}
                alt={getCategoryName(category)}
                fill
                className="object-contain"
              />
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black mb-2">{getCategoryName(category)}</h1>
            {category.description && (
              <p className="text-purple-200">{category.description}</p>
            )}
          </div>
        </div>
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {productsData.docs?.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {productsData.docs.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-bold text-gray-500">لا توجد منتجات في هذا التصنيف بعد</h3>
          </div>
        )}
      </div>
    </div>
  )
}
