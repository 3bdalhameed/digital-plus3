"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Heart, Share2, ShoppingCart, Zap, Star, ShoppingBag, ShieldCheck, Headphones, BadgeCheck, Minus, Plus, X, PenLine } from "lucide-react";
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

  // Review form modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) return;
    setReviewSubmitting(true);
    try {
      // Backend submit endpoint not built yet — this is the placeholder.
      // When you build /api/reviews, swap the next line for the fetch call.
      await new Promise((r) => setTimeout(r, 600));
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewOpen(false);
        setReviewRating(0);
        setReviewName("");
        setReviewText("");
        setReviewSubmitted(false);
      }, 1800);
    } finally {
      setReviewSubmitting(false);
    }
  };
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
            <Link href={`/collections/${product.category.slug}`} className="hover:text-[#7C3AED]">
              {product.category.nameAr ?? product.category.name?.ar ?? "الأقسام"}
            </Link>
            <span>/</span>
          </>
        )}
        <span className="font-medium text-[#1e1b4b]">{productName}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* Info column — LEFT side on desktop (RTL end) per the reference:
            product illustration lives on the right, details flow on the
            left where the eye lands next in the RTL reading order. */}
        <div className="order-2 space-y-5 lg:order-2">

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

        {/* Image column — RIGHT side on desktop (RTL start). */}
        <div className="order-1 space-y-3 lg:order-1">
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
          <div className="rounded-2xl border border-[#e8e4f8] bg-[#FAFAFC] p-6">
            <h2 className="mb-6 text-lg font-black text-[#1e1b4b]" dir="rtl">
              تقييمات العملاء
            </h2>

            {/* Empty state card */}
            <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#e8e4f8] bg-white px-6 py-12 text-center">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((i) => (
                  <Star key={i} className="h-7 w-7 text-[#D1D5DB]" strokeWidth={1.5} />
                ))}
              </div>

              <p className="mt-2 text-sm font-semibold text-[#1e1b4b]" dir="rtl">
                لا يوجد أي تقييمات.
              </p>
              <p className="text-sm text-[#6b7280]" dir="rtl">
                كن أول من يكتب تقييماً لهذا المنتج
              </p>

              <button
                onClick={() => setReviewOpen(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 py-2.5 text-sm font-black text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
              >
                <PenLine className="h-4 w-4" strokeWidth={2.5} />
                <span>يكتب تقييم</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Review submission modal ──────────────────────── */}
      {reviewOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-end justify-center bg-black/50 p-4 backdrop-blur-sm sm:items-center"
          onClick={(e) => e.target === e.currentTarget && setReviewOpen(false)}
          dir="rtl"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setReviewOpen(false)}
              className="absolute top-3 left-3 flex h-9 w-9 items-center justify-center rounded-full bg-[#F5F3FF] text-[#6b7280] transition-colors hover:bg-[#EDE9FE] hover:text-[#7C3AED]"
              aria-label="إغلاق"
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {reviewSubmitted ? (
              /* Success state */
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <BadgeCheck className="h-8 w-8 text-[#16A34A]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-[#1e1b4b]">شكراً لك!</h3>
                <p className="text-sm text-[#6b7280]">
                  تم استلام تقييمك وسيظهر بعد المراجعة.
                </p>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-black text-[#1e1b4b]">اكتب تقييماً</h3>
                <p className="mb-5 text-xs text-[#6b7280]">شاركنا تجربتك مع هذا المنتج</p>

                {/* Star rating selector */}
                <label className="mb-2 block text-xs font-bold text-[#1e1b4b]">
                  تقييمك *
                </label>
                <div className="mb-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                      aria-label={`${i} نجوم`}
                    >
                      <Star
                        className={`h-8 w-8 ${
                          i <= reviewRating
                            ? "fill-[#F59E0B] text-[#F59E0B]"
                            : "text-[#D1D5DB]"
                        }`}
                        strokeWidth={1.5}
                      />
                    </button>
                  ))}
                </div>

                {/* Name (optional) */}
                <label className="mb-2 block text-xs font-bold text-[#1e1b4b]">
                  اسمك (اختياري)
                </label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder="أحمد"
                  className="mb-4 w-full rounded-xl border border-[#ddd6fe] bg-white px-4 py-2.5 text-sm text-[#1e1b4b] outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />

                {/* Review text */}
                <label className="mb-2 block text-xs font-bold text-[#1e1b4b]">
                  تقييمك *
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder="اخبرنا عن تجربتك..."
                  rows={4}
                  className="mb-5 w-full resize-none rounded-xl border border-[#ddd6fe] bg-white px-4 py-2.5 text-sm text-[#1e1b4b] outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />

                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || !reviewText.trim() || reviewSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] py-3 text-sm font-black text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {reviewSubmitting ? "جاري الإرسال..." : "إرسال التقييم"}
                </button>
              </>
            )}
          </div>
        </div>
      )}

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

      {/* Sticky bottom action bar
          - Mobile: floating rounded-full pill with margins from screen edges,
            buttons + quantity in a single compact row (no wrapping).
          - Desktop: full-width bar with centered button group and stacked
            quantity on the end side. */}
      <div className="fixed inset-x-0 bottom-0 z-40 sm:bottom-0">
        {/* Mobile floating pill */}
        <div className="mx-3 mb-3 rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] shadow-[0_10px_30px_rgba(91,33,182,0.35)] sm:hidden">
          <div className="flex items-center justify-between gap-2 px-2 py-2" dir="rtl">
            {/* Add to cart pill (start side = right in RTL) */}
            <button
              onClick={handleAdd}
              className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2 text-xs font-black text-[#5B21B6] shadow-sm transition-all active:scale-95"
            >
              <ShoppingCart className="h-4 w-4 text-[#7C3AED]" strokeWidth={2.5} />
              <span>أضف إلى السلة</span>
            </button>

            {/* Quantity pill inline with the buttons on mobile */}
            <div className="flex shrink-0 items-center gap-1.5 text-white">
              <span className="text-[11px] font-bold opacity-90">الكمية</span>
              <div className="flex items-center gap-0.5 rounded-full bg-white px-1 py-0.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]"
                  aria-label="ناقص"
                >
                  <Minus className="h-3 w-3" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1.25rem] text-center text-xs font-black text-[#5B21B6]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]"
                  aria-label="زائد"
                >
                  <Plus className="h-3 w-3" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Desktop bar — matches reference:
             • Buttons live in a white-outlined pill container on the LEFT
               (RTL end), NOT centered.
             • Quantity sits on the RIGHT (RTL start) with the "الكمية"
               label INLINE beside the -/1/+ pill (not stacked above). */}
        <div className="hidden border-t border-white/10 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] sm:block">
          <div
            className="mx-auto flex max-w-[90rem] items-center justify-between gap-3 px-4 py-3"
            dir="rtl"
          >
            {/* Buttons container (DOM first in RTL flex-between → visual
                right); pushed to the LEFT visually via order-2 so
                quantity claims the right. */}
            <div className="order-2 flex items-center gap-3 rounded-2xl border border-white/40 bg-transparent p-2">
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-black text-[#5B21B6] shadow-sm transition-all hover:bg-[#FAF5FF] hover:scale-[1.02] active:scale-95"
              >
                <Zap className="h-4 w-4 text-orange-500" strokeWidth={2.5} fill="currentColor" />
                <span>اشتري الآن</span>
              </button>
              <button
                onClick={handleAdd}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-black text-[#5B21B6] shadow-sm transition-all hover:bg-[#FAF5FF] hover:scale-[1.02] active:scale-95"
              >
                <ShoppingCart className="h-4 w-4 text-[#7C3AED]" strokeWidth={2.5} />
                <span>أضف إلى السلة</span>
              </button>
            </div>

            {/* Quantity — order-1 pins it to the right (RTL start).
                Label + pill on the same row. */}
            <div className="order-1 flex shrink-0 items-center gap-2 text-white">
              <span className="text-sm font-bold opacity-90">الكمية</span>
              <div className="flex items-center gap-1 rounded-full bg-white px-1.5 py-1">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]"
                  aria-label="ناقص"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1.5rem] text-center text-sm font-black text-[#5B21B6]">
                  {qty}
                </span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]"
                  aria-label="زائد"
                >
                  <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
