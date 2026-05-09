"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, ShoppingCart, Zap, Star, ShoppingBag, ShieldCheck, Headphones, BadgeCheck, Minus, Plus } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { formatPrice } from "@/lib/utils";
import { lexicalToHtml } from "@/lib/lexical";
import type { Product } from "@my-store/types";

interface Props {
  product: any;
  productName: string;
}

export function ProductDetailClient({ product, productName }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const [tab, setTab] = useState<"desc" | "reviews">("desc");
  const [qty, setQty] = useState(1);
  const [deliveryInfo, setDeliveryInfo] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const purchaseCount = product.totalSales ?? product.purchaseCount ?? 0;
  const rating = product.rating ?? 5;
  const reviewCount = product.reviewCount ?? 4;
  const deliveryFields: any[] = product.deliveryFields || [];
  const relatedProducts: any[] = product.relatedProducts || [];

  const handleAdd = () => {
    const errors: string[] = [];
    for (let idx = 0; idx < deliveryFields.length; idx++) {
      const field = deliveryFields[idx];
      const key = field.id || String(idx);
      if (field.required && !deliveryInfo[key]?.trim()) {
        errors.push(key);
      }
    }
    if (errors.length > 0) {
      setFieldErrors(errors);
      document.getElementById("delivery-fields")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setFieldErrors([]);
    for (let i = 0; i < qty; i++) addItem(product as Product, deliveryInfo);
  };

  return (
    <div className="pb-28">
      {/* Breadcrumb */}
      <div className="mb-4 flex items-center justify-end gap-2 text-sm text-[#6b7280]">
        <Link href="/" className="hover:text-[#7C3AED]">الصفحة الرئيسية</Link>
        <span>/</span>
        {product.category && (
          <>
            <Link href={`/category/${product.category.slug}`} className="hover:text-[#7C3AED]">
              {product.category.nameAr ?? product.category.name?.ar ?? "الأقسام"}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-[#1e1b4b]">{productName}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* Info column */}
        <div className="order-2 space-y-5 lg:order-1">

          {/* Title + actions */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-black leading-snug text-[#1e1b4b] md:text-2xl">
              {productName}
            </h1>
            <div className="flex shrink-0 gap-2">
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] transition-colors hover:bg-[#ddd6fe]">
                <Heart className="h-4 w-4" />
              </button>
              <button className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] transition-colors hover:bg-[#ddd6fe]">
                <Share2 className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#6b7280]">
              📱 منتج رقمي: سيتم تسليم طلبك إلكترونياً بصيغة رقمية
            </span>
            <button
              onClick={() => {
                document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" });
                setTab("desc");
              }}
              className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-3 py-1 text-xs font-bold text-white"
            >
              عرض الوصف
            </button>
          </div>

          {/* Rating + Price */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="mr-1 text-xs text-[#6b7280]">({reviewCount} تقييمات)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#7C3AED]">
                {formatPrice(product.price, product.currency)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[#9ca3af] line-through">
                  {formatPrice(product.comparePrice, product.currency)}
                </span>
              )}
            </div>
          </div>

          {/* Purchase count card */}
          <div className="flex items-center justify-between rounded-2xl border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#7C3AED]" />
              <span className="text-sm text-[#4c1d95]">عدد مرات الشراء</span>
            </div>
            <span className="rounded-lg bg-[#7C3AED] px-3 py-1 text-xs font-black text-white">
              {purchaseCount}
            </span>
          </div>

          {/* Dynamic Delivery Fields */}
          {deliveryFields.length > 0 && (
            <div id="delivery-fields" className="space-y-4">
              {deliveryFields.map((field: any, idx: number) => {
                const key = field.id || String(idx);
                const hasError = fieldErrors.includes(key);
                const inputClass = `w-full rounded-xl border px-4 py-3 text-sm text-[#1e1b4b] placeholder:text-[#9ca3af] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#ddd6fe] bg-white ${hasError ? "border-red-400" : "border-[#e8e4f8]"}`;

                return (
                  <div key={key}>
                    <label className="mb-2 block text-sm font-medium text-[#1e1b4b]">
                      {field.labelAr}
                      {field.required && <span className="text-red-500"> *</span>}
                    </label>
                    {field.helpText && (
                      <p className="mb-1 text-xs text-[#6b7280]">{field.helpText}</p>
                    )}
                    {field.fieldType === "select" ? (
                      <select
                        value={deliveryInfo[key] || ""}
                        onChange={(e) => setDeliveryInfo((prev) => ({ ...prev, [key]: e.target.value }))}
                        className={inputClass}
                      >
                        <option value="">-- الرجاء التحديد --</option>
                        {(field.selectOptions || "").split(",").map((opt: string) => opt.trim()).filter(Boolean).map((opt: string) => (
                          <option key={opt} value={opt}>{opt}</option>
                        ))}
                      </select>
                    ) : (
                      <input
                        type={field.fieldType === "tel" ? "tel" : field.fieldType === "email" ? "email" : "text"}
                        value={deliveryInfo[key] || ""}
                        onChange={(e) => setDeliveryInfo((prev) => ({ ...prev, [key]: e.target.value }))}
                        placeholder={field.placeholder || ""}
                        className={inputClass}
                        dir={field.fieldType === "tel" || field.fieldType === "email" ? "ltr" : undefined}
                      />
                    )}
                    {hasError && (
                      <p className="mt-1 text-xs text-red-500">هذا الحقل مطلوب</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Payment methods */}
          <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#7C3AED] to-[#6D28D9] p-5 text-white">
            <div className="mb-3 text-right text-sm font-bold">طرق الدفع المتاحة</div>
            <div className="flex flex-wrap justify-end gap-2 text-xs">
              <span className="rounded-lg bg-white/15 px-3 py-1.5">💳 فيزا</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5">💳 ماستركارد</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5">🅿️ آبل باي</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5">G Pay جوجل باي</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5">💰 أمريكان إكسبريس</span>
              <span className="rounded-lg bg-white/15 px-3 py-1.5">🔒 طرق أخرى آمنة 100%</span>
            </div>
          </div>

          {/* Trust features */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-[#e8e4f8] bg-white p-4">
              <div className="flex items-center gap-2">
                <Headphones className="h-5 w-5 text-[#7C3AED]" />
                <span className="text-sm font-bold text-[#1e1b4b]">دعم فني مميز</span>
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                فريقنا جاهز لمساعدتك بكل الأوقات
              </p>
            </div>
            <div className="rounded-2xl border border-[#e8e4f8] bg-white p-4">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5 text-[#7C3AED]" />
                <span className="text-sm font-bold text-[#1e1b4b]">متجر موثوق</span>
              </div>
              <p className="mt-1 text-xs text-[#6b7280]">
                تجارب عملاء ممتازة وتقييمات عالية
              </p>
            </div>
          </div>
        </div>

        {/* Image column */}
        <div className="order-1 space-y-3 lg:order-2">
          <div className="relative aspect-square overflow-hidden rounded-2xl bg-[#f5f3ff]">
            {product.images?.[0]?.image?.url ? (
              <Image
                src={product.images[0].image.url}
                alt={productName}
                fill
                className="object-contain p-6"
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
      </div>

      {/* Tabs */}
      <div id="product-tabs" className="mt-10">
        <div className="mb-4 flex justify-center gap-3">
          <button
            onClick={() => setTab("desc")}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
              tab === "desc"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md"
                : "border border-[#ddd6fe] bg-white text-[#7C3AED]"
            }`}
          >
            الوصف
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
              tab === "reviews"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md"
                : "border border-[#ddd6fe] bg-white text-[#7C3AED]"
            }`}
          >
            التقييمات
          </button>
        </div>

        {tab === "desc" ? (
          <div className="rounded-2xl border border-[#e8e4f8] bg-white p-6">
            {(() => {
              const html = product.descriptionHtml || lexicalToHtml(product.description);
              return html ? (
                <div
                  className="prose prose-sm max-w-none text-right"
                  dir="rtl"
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <p className="text-center text-sm text-[#6b7280]">لا يوجد وصف مفصل لهذا المنتج.</p>
              );
            })()}
          </div>
        ) : (
          <div className="rounded-2xl border border-[#e8e4f8] bg-white p-6 text-center">
            <p className="text-sm text-[#6b7280]">لا توجد تقييمات بعد.</p>
          </div>
        )}
      </div>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-5 text-center text-lg font-black text-[#1e1b4b]">منتجات مشابهة</h2>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedProducts.map((related: any) => (
              <Link
                key={related.id}
                href={`/products/${related.slug}`}
                className="group rounded-2xl border border-[#e8e4f8] bg-white p-4 transition-all hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="relative mb-3 aspect-square overflow-hidden rounded-xl bg-[#f5f3ff]">
                  {related.images?.[0]?.image?.url ? (
                    <Image
                      src={related.images[0].image.url}
                      alt={related.nameAr || ""}
                      fill
                      className="object-contain p-3"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center text-4xl">📦</div>
                  )}
                </div>
                <p className="line-clamp-2 text-sm font-bold text-[#1e1b4b] group-hover:text-[#7C3AED]">
                  {related.nameAr || related.name?.ar || ""}
                </p>
                <p className="mt-1 text-sm font-extrabold text-[#7C3AED]">
                  {formatPrice(related.price, related.currency)}
                </p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Sticky bottom action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-[#e8e4f8] bg-gradient-to-r from-[#7C3AED]/95 to-[#9333EA]/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3 text-white">
            <span className="text-sm">الكمية</span>
            <div className="flex items-center gap-2 rounded-full bg-white/20 p-1">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#7C3AED] hover:bg-white"
              >
                <Minus className="h-3 w-3" />
              </button>
              <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
              <button
                onClick={() => setQty((q) => q + 1)}
                className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-[#7C3AED] hover:bg-white"
              >
                <Plus className="h-3 w-3" />
              </button>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-bold text-[#7C3AED] shadow-sm hover:bg-[#f5f3ff]"
            >
              <ShoppingCart className="h-4 w-4" />
              أضف إلى السلة
            </button>
            <button
              onClick={handleAdd}
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-yellow-400 to-orange-400 px-5 py-2.5 text-sm font-bold text-white shadow-sm hover:from-yellow-500 hover:to-orange-500"
            >
              <Zap className="h-4 w-4" />
              اشتري الآن
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
