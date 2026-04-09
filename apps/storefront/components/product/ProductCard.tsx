'use client'

import Image from 'next/image'
import Link from 'next/link'
import { ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useCartStore } from '@/lib/store'
import { formatPrice, getProductName } from '@/lib/utils'

interface ProductCardProps {
  product: any
}

const typeLabels: Record<string, string> = {
  software_subscription: 'اشتراك برمجي',
  license_key: 'مفتاح ترخيص',
  invitation: 'دعوة',
  gaming_card: 'بطاقة ألعاب',
  ai_subscription: 'اشتراك AI',
}

export function ProductCard({ product }: ProductCardProps) {
  const addItem = useCartStore((s) => s.addItem)
  const thumbnail = product.images?.[0]?.image?.url || product.images?.[0]?.url

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      slug: product.slug,
      name: getProductName(product),
      price: product.price,
      currency: product.currency,
      quantity: 1,
      image: thumbnail,
    })
  }

  return (
    <Link href={`/products/${product.slug}`} className="product-card block group">
      {/* Image */}
      <div className="relative aspect-video bg-gradient-to-br from-purple-50 to-purple-100 overflow-hidden">
        {thumbnail ? (
          <Image
            src={thumbnail}
            alt={getProductName(product)}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-4xl opacity-30">📦</span>
          </div>
        )}
        {product.comparePrice && product.comparePrice > product.price && (
          <div className="absolute top-2 right-2">
            <Badge variant="destructive">
              خصم{' '}
              {Math.round(
                ((product.comparePrice - product.price) / product.comparePrice) * 100,
              )}
              %
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4">
        <Badge variant="secondary" className="mb-2 text-xs">
          {typeLabels[product.type] || product.type}
        </Badge>
        <h3 className="font-bold text-primary-dark text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
          {getProductName(product)}
        </h3>

        {/* Price */}
        <div className="flex items-center gap-2 mt-3">
          <span className="text-lg font-extrabold text-primary">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <span className="text-sm text-gray-400 line-through">
              {formatPrice(product.comparePrice, product.currency)}
            </span>
          )}
        </div>

        {/* Add to cart */}
        <Button
          className="w-full mt-3"
          size="sm"
          onClick={handleAddToCart}
        >
          <ShoppingCart className="h-4 w-4 ml-2" />
          أضف للسلة
        </Button>
      </div>
    </Link>
  )
}
