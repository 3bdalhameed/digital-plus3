interface FeatureBlocksProps {
  block: {
    items: { title: string; description?: string; icon?: string }[]
    enabled: boolean
  }
}

export function FeatureBlocks({ block }: FeatureBlocksProps) {
  if (!block.enabled || !block.items?.length) return null

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {block.items.map((item, i) => (
          <div key={i} className="card-purple p-8 text-center">
            {item.icon && (
              <div className="text-4xl mb-4">{item.icon}</div>
            )}
            <h3 className="font-bold text-primary-dark text-lg mb-2">{item.title}</h3>
            {item.description && (
              <p className="text-gray-500 text-sm">{item.description}</p>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
