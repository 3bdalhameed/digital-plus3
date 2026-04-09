import { ProductCard } from '@/components/product/ProductCard'

interface FeaturedProductsProps {
  block: {
    title?: string
    products: any[]
    enabled: boolean
  }
}

export function FeaturedProducts({ block }: FeaturedProductsProps) {
  if (!block.enabled || !block.products?.length) return null

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {block.title && (
        <h2 className="text-3xl font-black text-primary-dark mb-8 text-center">
          {block.title}
        </h2>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {block.products.map((product: any) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  )
}
