'use client'

import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useCartStore } from '@/lib/store'
import { formatPrice } from '@/lib/utils'

export default function CartPage() {
  const { items, removeItem, updateQuantity, total } = useCartStore()
  const cartTotal = total()
  const currency = items[0]?.currency || 'USD'

  if (items.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <ShoppingBag className="h-20 w-20 text-purple-200 mx-auto mb-6" />
        <h2 className="text-2xl font-bold text-gray-500 mb-4">سلة التسوق فارغة</h2>
        <p className="text-gray-400 mb-8">أضف بعض المنتجات للمتابعة</p>
        <Link href="/products">
          <Button>تصفح المنتجات</Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <h1 className="text-3xl font-black text-primary-dark mb-8">سلة التسوق</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Items */}
        <div className="lg:col-span-2 space-y-4">
          {items.map((item) => (
            <div key={item.id} className="card-purple p-4 flex items-center gap-4">
              {/* Image */}
              <div className="w-20 h-20 relative shrink-0 bg-purple-50 rounded-xl overflow-hidden">
                {item.image ? (
                  <Image src={item.image} alt={item.name} fill className="object-contain p-2" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-primary-dark truncate">{item.name}</h3>
                <p className="text-primary font-extrabold mt-1">
                  {formatPrice(item.price, item.currency)}
                </p>
              </div>

              {/* Quantity */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-8 h-8 rounded-full border border-purple-200 flex items-center justify-center hover:bg-purple-50 transition-colors"
                >
                  <Minus className="h-3 w-3 text-primary" />
                </button>
                <span className="w-8 text-center font-bold">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-8 h-8 rounded-full border border-purple-200 flex items-center justify-center hover:bg-purple-50 transition-colors"
                >
                  <Plus className="h-3 w-3 text-primary" />
                </button>
              </div>

              {/* Subtotal */}
              <div className="text-right shrink-0">
                <p className="font-bold text-primary-dark">
                  {formatPrice(item.price * item.quantity, item.currency)}
                </p>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.productId)}
                className="text-red-400 hover:text-red-600 transition-colors p-2"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="lg:col-span-1">
          <div className="card-purple p-6 sticky top-24">
            <h2 className="text-xl font-bold text-primary-dark mb-4">ملخص الطلب</h2>

            <div className="space-y-3 mb-6">
              {items.map((item) => (
                <div key={item.id} className="flex justify-between text-sm text-gray-600">
                  <span className="truncate max-w-[60%]">{item.name} × {item.quantity}</span>
                  <span>{formatPrice(item.price * item.quantity, item.currency)}</span>
                </div>
              ))}
            </div>

            <div className="border-t border-purple-100 pt-4 mb-6">
              <div className="flex justify-between font-extrabold text-xl">
                <span className="text-primary-dark">الإجمالي</span>
                <span className="text-primary">{formatPrice(cartTotal, currency)}</span>
              </div>
            </div>

            <Link href="/checkout">
              <Button className="w-full" size="lg">
                المتابعة للدفع
              </Button>
            </Link>
            <Link href="/products">
              <Button variant="ghost" className="w-full mt-2" size="sm">
                متابعة التسوق
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
