import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/payload";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";

export const revalidate = 60;

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "منتج غير موجود" };
  return {
    title: product.name.ar,
    description: product.seoDescription || product.name.ar,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const product = await getProductBySlug(params.slug).catch(() => null);

  if (!product) notFound();

  const typeLabels: Record<string, string> = {
    software_subscription: "اشتراك برمجيات",
    license_key: "مفتاح ترخيص",
    invitation: "دعوة",
    gaming_card: "بطاقة ألعاب",
    ai_subscription: "اشتراك أدوات ذكاء اصطناعي",
  };

  const deliveryLabels: Record<string, string> = {
    email: "بريد إلكتروني",
    on_site: "على الموقع",
    both: "بريد إلكتروني + الموقع",
  };

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      {/* Image Gallery */}
      <div className="space-y-4">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-white shadow-card">
          {product.images?.[0]?.image?.url ? (
            <Image
              src={product.images[0].image.url}
              alt={product.name.ar}
              fill
              className="object-contain p-8"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">
              📦
            </div>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((img: any, i: number) => (
              <div
                key={i}
                className="relative aspect-square overflow-hidden rounded-xl bg-white shadow-sm"
              >
                <Image
                  src={img.image?.url || ""}
                  alt=""
                  fill
                  className="object-contain p-2"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <a href="/products" className="hover:text-brand-500">المنتجات</a>
          <span>/</span>
          {product.category && (
            <>
              <a
                href={`/category/${product.category.slug}`}
                className="hover:text-brand-500"
              >
                {product.category.nameAr || product.category.name?.ar}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-brand-600">{product.name.ar}</span>
        </div>

        <h1 className="text-2xl font-black text-brand-800 md:text-3xl">
          {product.name.ar}
        </h1>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-brand-600">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <>
              <span className="text-lg text-gray-400 line-through">
                {formatPrice(product.comparePrice, product.currency)}
              </span>
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold text-red-600">
                وفر{" "}
                {Math.round(
                  ((product.comparePrice - product.price) /
                    product.comparePrice) *
                    100
                )}
                %
              </span>
            </>
          )}
        </div>

        {/* Meta info */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs text-gray-400">نوع المنتج</p>
            <p className="text-sm font-bold text-brand-700">
              {typeLabels[product.type] || product.type}
            </p>
          </div>
          <div className="rounded-xl bg-brand-50 p-3">
            <p className="text-xs text-gray-400">طريقة التسليم</p>
            <p className="text-sm font-bold text-brand-700">
              {deliveryLabels[product.deliveryMethod] || product.deliveryMethod}
            </p>
          </div>
        </div>

        {/* Add to cart */}
        <AddToCartButton product={product} />

        {/* Refund policy */}
        <div className="rounded-xl border border-brand-100 bg-brand-50/50 p-4">
          <p className="text-sm font-bold text-brand-700">
            {product.refundable
              ? "✓ قابل للاسترداد وفقاً لسياسة الاسترداد"
              : "✕ غير قابل للاسترداد بعد التسليم والاستخدام"}
          </p>
          {product.refundPolicy && (
            <p className="mt-2 text-xs text-gray-500">
              {product.refundPolicy}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
