import type { Metadata } from 'next'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { getProductBySlug } from '@/lib/payload'
import { AddToCartButton } from '@/components/product/AddToCartButton'
import { Badge } from '@/components/ui/badge'
import { formatPrice, getProductName } from '@/lib/utils'
import { Shield, Zap, CheckCircle2 } from 'lucide-react'

interface Props {
  params: { slug: string }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProductBySlug(params.slug).catch(() => null)
  if (!product) return {}
  return {
    title: getProductName(product),
    description: product.seoDescription || '',
    openGraph: product.seoImage?.url
      ? { images: [product.seoImage.url] }
      : undefined,
  }
}

const typeLabels: Record<string, string> = {
  software_subscription: 'اشتراك برمجي',
  license_key: 'مفتاح ترخيص',
  invitation: 'دعوة',
  gaming_card: 'بطاقة ألعاب',
  ai_subscription: 'اشتراك AI',
}

const deliveryLabels: Record<string, string> = {
  email: 'يُسلَّم عبر البريد الإلكتروني',
  on_site: 'يُسلَّم داخل المنصة فور الدفع',
  both: 'يُسلَّم عبر البريد الإلكتروني وداخل المنصة',
}

export default async function ProductDetailPage({ params }: Props) {
  const product = await getProductBySlug(params.slug).catch(() => null)
  if (!product) notFound()

  const thumbnail = product.images?.[0]?.image?.url

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Images */}
        <div>
          <div className="relative aspect-square bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl overflow-hidden mb-4">
            {thumbnail ? (
              <Image
                src={thumbnail}
                alt={getProductName(product)}
                fill
                className="object-contain p-8"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-8xl opacity-30">
                📦
              </div>
            )}
          </div>
          {/* Thumbnail strip */}
          {product.images?.length > 1 && (
            <div className="flex gap-2">
              {product.images.map((img: any, i: number) => (
                <div
                  key={i}
                  className="w-16 h-16 relative rounded-lg overflow-hidden border-2 border-purple-200"
                >
                  <Image
                    src={img.image?.url || img.url}
                    alt={img.alt || ''}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Info */}
        <div>
          <div className="flex items-center gap-2 mb-3">
            {product.category && (
              <Badge variant="secondary">{product.category.name_ar}</Badge>
            )}
            <Badge variant="outline">{typeLabels[product.type] || product.type}</Badge>
          </div>

          <h1 className="text-3xl font-black text-primary-dark mb-4">
            {getProductName(product)}
          </h1>

          {/* Price */}
          <div className="flex items-baseline gap-3 mb-6">
            <span className="text-4xl font-extrabold text-primary">
              {formatPrice(product.price, product.currency)}
            </span>
            {product.comparePrice && product.comparePrice > product.price && (
              <span className="text-xl text-gray-400 line-through">
                {formatPrice(product.comparePrice, product.currency)}
              </span>
            )}
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="text-center p-3 bg-green-50 rounded-xl">
              <Zap className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <span className="text-xs text-green-700 font-medium">تسليم فوري</span>
            </div>
            <div className="text-center p-3 bg-blue-50 rounded-xl">
              <Shield className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <span className="text-xs text-blue-700 font-medium">دفع آمن</span>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-xl">
              <CheckCircle2 className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <span className="text-xs text-purple-700 font-medium">مضمون</span>
            </div>
          </div>

          {/* Delivery info */}
          <div className="bg-purple-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-primary-dark font-medium">
              🚀 {deliveryLabels[product.deliveryMethod] || product.deliveryMethod}
            </p>
          </div>

          {/* Add to cart */}
          <AddToCartButton product={product} />

          {/* Refund policy */}
          {product.refundable && product.refundPolicy && (
            <div className="mt-4 p-4 bg-gray-50 rounded-xl text-sm text-gray-600">
              <p className="font-medium text-gray-700 mb-1">سياسة الاسترجاع:</p>
              {product.refundPolicy}
            </div>
          )}

          {!product.refundable && (
            <p className="mt-4 text-xs text-gray-400">
              * المنتجات الرقمية غير قابلة للاسترجاع بعد التسليم
            </p>
          )}
        </div>
      </div>

      {/* Description */}
      {product.description && (
        <div className="mt-12 card-purple p-8">
          <h2 className="text-xl font-bold text-primary-dark mb-4">وصف المنتج</h2>
          <div className="prose prose-purple max-w-none text-gray-600">
            {/* Rich text would be rendered here */}
            <p>تفاصيل المنتج متاحة في لوحة التحكم</p>
          </div>
        </div>
      )}
    </div>
  )
}
