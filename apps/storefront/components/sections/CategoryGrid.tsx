import { CategoryCard } from '@/components/product/CategoryCard'

interface CategoryGridProps {
  block: {
    title?: string
    categories: any[]
    enabled: boolean
  }
}

export function CategoryGrid({ block }: CategoryGridProps) {
  if (!block.enabled || !block.categories?.length) return null

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {block.title && (
        <h2 className="text-3xl font-black text-primary-dark mb-8 text-center">
          {block.title}
        </h2>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {block.categories.map((cat: any) => (
          <CategoryCard key={cat.id} category={cat} />
        ))}
      </div>
    </section>
  )
}
