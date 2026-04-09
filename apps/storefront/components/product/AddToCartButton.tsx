'use client'

import { useState } from 'react'
import { ShoppingCart, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { getProductName } from '@/lib/utils'

interface AddToCartButtonProps {
  product: any
}

export function AddToCartButton({ product }: AddToCartButtonProps) {
  const [added, setAdded] = useState(false)
  const addItem = useCartStore((s) => s.addItem)

  const handleAdd = () => {
    addItem({
      id: `${product.id}-${Date.now()}`,
      productId: product.id,
      slug: product.slug,
      name: getProductName(product),
      price: product.price,
      currency: product.currency,
      quantity: 1,
      image: product.images?.[0]?.image?.url,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  return (
    <Button
      size="lg"
      className="w-full text-lg"
      onClick={handleAdd}
      variant={added ? 'secondary' : 'default'}
    >
      {added ? (
        <>
          <Check className="h-5 w-5 ml-2" />
          تمت الإضافة للسلة
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5 ml-2" />
          أضف إلى السلة
        </>
      )}
    </Button>
  )
}
