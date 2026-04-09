interface TestimonialsProps {
  block: {
    items: { name: string; text: string; rating?: number }[]
    enabled: boolean
  }
}

export function Testimonials({ block }: TestimonialsProps) {
  if (!block.enabled || !block.items?.length) return null

  return (
    <section className="py-16 bg-primary-light/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-black text-primary-dark mb-10 text-center">
          آراء عملائنا
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {block.items.map((item, i) => (
            <div key={i} className="card-purple p-6">
              <div className="flex gap-1 mb-3 text-yellow-400">
                {'★'.repeat(item.rating || 5)}
              </div>
              <p className="text-gray-600 text-sm mb-4 leading-relaxed">"{item.text}"</p>
              <p className="font-bold text-primary-dark">{item.name}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
