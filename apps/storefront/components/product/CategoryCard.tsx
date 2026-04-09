import Link from 'next/link'
import Image from 'next/image'
import { getCategoryName } from '@/lib/utils'

interface CategoryCardProps {
  category: any
}

export function CategoryCard({ category }: CategoryCardProps) {
  return (
    <Link
      href={`/category/${category.slug}`}
      className="category-card group flex flex-col items-center text-center"
    >
      {/* 3D Icon */}
      <div className="w-20 h-20 mb-4 relative">
        {category.icon?.url ? (
          <Image
            src={category.icon.url}
            alt={getCategoryName(category)}
            fill
            className="object-contain group-hover:scale-110 transition-transform duration-300"
          />
        ) : category.image?.url ? (
          <Image
            src={category.image.url}
            alt={getCategoryName(category)}
            fill
            className="object-cover rounded-xl group-hover:scale-110 transition-transform duration-300"
          />
        ) : (
          <div className="w-20 h-20 bg-gradient-purple rounded-2xl flex items-center justify-center text-3xl group-hover:scale-110 transition-transform duration-300">
            🎮
          </div>
        )}
      </div>

      {/* Name */}
      <h3 className="font-bold text-primary-dark text-base mb-1 group-hover:text-primary transition-colors">
        {getCategoryName(category)}
      </h3>

      {/* Description */}
      {category.description && (
        <p className="text-gray-500 text-xs line-clamp-2 mb-3">
          {category.description}
        </p>
      )}

      {/* Brand logos strip */}
      {category.brandLogos?.length > 0 && (
        <div className="flex items-center gap-1 flex-wrap justify-center mt-auto pt-3 border-t border-purple-100 w-full">
          {category.brandLogos.slice(0, 5).map((bl: any, i: number) => (
            <div key={i} className="w-6 h-6 relative">
              <Image
                src={bl.logo?.url || bl.url}
                alt={bl.brandName || ''}
                fill
                className="object-contain"
              />
            </div>
          ))}
          {category.brandLogos.length > 5 && (
            <span className="text-xs text-gray-400">+{category.brandLogos.length - 5}</span>
          )}
        </div>
      )}
    </Link>
  )
}
