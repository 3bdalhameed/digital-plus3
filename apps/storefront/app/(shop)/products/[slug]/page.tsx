import { notFound } from "next/navigation";
import Image from "next/image";
import { getProductBySlug } from "@/lib/payload";
import { formatPrice } from "@/lib/utils";
import { AddToCartButton } from "./AddToCartButton";

export const revalidate = 60;

// Helper — works whether the API returns nameAr or name.ar
function productName(product: any): string {
  return product.nameAr ?? product.name?.ar ?? product.nameEn ?? product.name?.en ?? "";
}

export async function generateMetadata({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) return { title: "منتج غير موجود" };
  const name = productName(product);
  return {
    title: name,
    description: product.seoDescription || name,
  };
}

export default async function ProductDetailPage({ params }: { params: { slug: string } }) {
  const product = await getProductBySlug(params.slug).catch(() => null);
  if (!product) notFound();

  const name = productName(product);

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
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f5f3ff]">
          {product.images?.[0]?.image?.url ? (
            <Image
              src={product.images[0].image.url}
              alt={name}
              fill
              className="object-contain p-8"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-6xl">📦</div>
          )}
        </div>
        {product.images?.length > 1 && (
          <div className="grid grid-cols-4 gap-2">
            {product.images.slice(1, 5).map((img: any, i: number) => (
              <div key={i} className="relative aspect-square overflow-hidden rounded-xl bg-[#f5f3ff]">
                <Image src={img.image?.url || ""} alt="" fill className="object-contain p-2" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-6">

        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-[#9ca3af]">
          <a href="/products" className="hover:text-[#7C3AED]">المنتجات</a>
          <span>/</span>
          {product.category && (
            <>
              <a href={`/products?category=${product.category.slug}`} className="hover:text-[#7C3AED]">
                {product.category.nameAr ?? product.category.name?.ar}
              </a>
              <span>/</span>
            </>
          )}
          <span className="text-[#7C3AED]">{name}</span>
        </div>

        <h1 className="text-2xl font-black text-[#1e1b4b] md:text-3xl">{name}</h1>

        {/* Price */}
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold text-[#7C3AED]">
            {formatPrice(product.price, product.currency)}
          </span>
          {product.comparePrice && product.comparePrice > product.price && (
            <>
              <span className="text-lg text-[#9ca3af] line-through">
                {formatPrice(product.comparePrice, product.currency)}
              </span>
              <span className="rounded-full bg-[#EDE9FE] px-3 py-1 text-xs font-bold text-[#7C3AED]">
                وفر {Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
              </span>
            </>
          )}
        </div>

        {/* Meta */}
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-xl bg-[#f5f3ff] p-3">
            <p className="text-xs text-[#9ca3af]">نوع المنتج</p>
            <p className="text-sm font-bold text-[#7C3AED]">{typeLabels[product.type] || product.type}</p>
          </div>
          <div className="rounded-xl bg-[#f5f3ff] p-3">
            <p className="text-xs text-[#9ca3af]">طريقة التسليم</p>
            <p className="text-sm font-bold text-[#7C3AED]">{deliveryLabels[product.deliveryMethod] || product.deliveryMethod}</p>
          </div>
        </div>

        {/* Custom HTML description */}
        {product.descriptionHtml && (
          <div
            className="rounded-xl border border-[#e8e4f8] bg-white p-4"
            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
          />
        )}

        {/* Add to cart */}
        <AddToCartButton product={product} />

        {/* Refund */}
        <div className="rounded-xl border border-[#ddd6fe] bg-[#f5f3ff] p-4">
          <p className="text-sm font-bold text-[#4c1d95]">
            {product.refundable
              ? "✓ قابل للاسترداد وفقاً لسياسة الاسترداد"
              : "✕ غير قابل للاسترداد بعد التسليم والاستخدام"}
          </p>
          {product.refundPolicy && (
            <p className="mt-2 text-xs text-[#6b7280]">{product.refundPolicy}</p>
          )}
        </div>
      </div>
    </div>
  );
}
