"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "@/components/ui/link";
import { Heart, Share2, ShoppingCart, Zap, Star, ShoppingBag, BadgeCheck, Minus, Plus, X, PenLine, Loader2 } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useWishlistStore } from "@/lib/wishlist-store";
import { useLocaleStore } from "@/lib/locale-store";
import { formatPrice } from "@/lib/utils";
import { lexicalToHtml } from "@/lib/lexical";
import type { Product } from "@my-store/types";

interface Props {
  product: any;
  productName: string;
}

export function ProductDetailClient({ product, productName }: Props) {
  const addItem = useCartStore((s) => s.addItem);
  const toggleFav = useWishlistStore((s) => s.toggle);
  const isFav = useWishlistStore((s) => s.hasItem(product.id));
  // Transient "Copied!" flag for the share button when the browser
  // doesn't support the Web Share API and we fall back to clipboard.
  const [shareCopied, setShareCopied] = useState(false);

  const handleShare = async () => {
    // Web Share API is the preferred flow on mobile browsers -- opens
    // the OS share sheet. Fall back to copying the URL to the
    // clipboard on desktop / browsers without navigator.share.
    const url  = typeof window !== "undefined" ? window.location.href : "";
    const title = displayName || productName || "";
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({ title, url });
        return;
      }
    } catch { /* user cancelled -- silent */ }
    try {
      await navigator.clipboard.writeText(url);
      setShareCopied(true);
      setTimeout(() => setShareCopied(false), 1500);
    } catch { /* clipboard blocked -- silent */ }
  };
  // Read the visitor's chosen display currency (auto-detected from
  // their country by /api/geo, or manually picked via the header
  // switcher). ProductCard already does this on the home + listing
  // pages; the detail page was rendering in the product's base
  // currency verbatim, so a JO visitor with SAR selected still saw
  // USD prices here.
  const { currency: userCurrency, rates, lang } = useLocaleStore();
  const isEn = lang === "en";

  // Sticky bottom action bar overlaps the tail of the footer when the
  // page is scrolled to the very end. Tag <body> so a CSS rule in
  // globals.css can add extra bottom padding to the footer while this
  // page is mounted. Removed on unmount so other pages recover their
  // normal footer spacing.
  useEffect(() => {
    document.body.classList.add("has-sticky-actions");
    return () => document.body.classList.remove("has-sticky-actions");
  }, []);
  const [tab, setTab] = useState<"desc" | "reviews">("desc");
  const [qty, setQty] = useState(1);

  // Review form modal state
  const [reviewOpen, setReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewName, setReviewName] = useState("");
  const [reviewText, setReviewText] = useState("");
  const [reviewSubmitting, setReviewSubmitting] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Any signed-in visitor can review any product from this page,
  // buyer or not. When the modal opens we probe GET /api/reviews to
  // see whether this customer already left a review for this product
  // (regardless of order), so we can show their rating instead of the
  // form. The endpoint returns { reviewed: false } for anonymous
  // callers -- the form still renders, and POST will 401 on submit
  // which we surface as "please sign in".
  const [reviewStatus, setReviewStatus] = useState<{
    checked: boolean;
    existingRating: number | null;
  }>({ checked: false, existingRating: null });

  useEffect(() => {
    if (!reviewOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/reviews?productId=${product.id}`,
          { credentials: "include", cache: "no-store" },
        );
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setReviewStatus({
          checked: true,
          existingRating: data?.reviewed ? (data?.rating ?? null) : null,
        });
      } catch {
        if (!cancelled) setReviewStatus({ checked: true, existingRating: null });
      }
    })();
    return () => { cancelled = true; };
  }, [reviewOpen, product.id]);

  const handleSubmitReview = async () => {
    if (!reviewRating || !reviewText.trim()) return;
    setReviewError(null);
    setReviewSubmitting(true);
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productId:  product.id,
          rating:     reviewRating,
          reviewText: reviewText.trim(),
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        // 401 = not signed in. Route returns { error: "غير مصرح" }
        // but a friendlier localized prompt is worth the special case.
        if (res.status === 401) {
          setReviewError("يجب تسجيل الدخول لإرسال تقييم.");
        } else {
          setReviewError(data?.error ?? "تعذّر إرسال التقييم.");
        }
        return;
      }
      setReviewSubmitted(true);
      setTimeout(() => {
        setReviewOpen(false);
        setReviewRating(0);
        setReviewName("");
        setReviewText("");
        setReviewSubmitted(false);
      }, 1800);
    } catch {
      setReviewError("تعذّر الاتصال بالخادم.");
    } finally {
      setReviewSubmitting(false);
    }
  };
  const [deliveryInfo, setDeliveryInfo] = useState<Record<string, string>>({});
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const hasDiscount = product.comparePrice && product.comparePrice > product.price;
  const purchaseCount = product.totalSales ?? product.purchaseCount ?? 0;
  // Default to in-stock so pre-migration rows (inStock === undefined)
  // don't accidentally show "Out of stock". Only an explicit `false`
  // flips the button.
  const inStock = product.inStock !== false;
  const deliveryFields: any[] = product.deliveryFields || [];

  // Live rating + review count. The previous code was `product.rating
  // ?? 5` and `product.reviewCount ?? 4` -- placeholder defaults that
  // showed 5 stars and "(4 reviews)" on every product that hadn't been
  // rated yet. We fetch the real aggregate from /api/product-reviews
  // (approved reviews only) so a brand-new product reads as 0 and the
  // header updates the moment moderation approves a review. Starts at
  // whatever the payload precomputed on the row so the first render
  // isn't a jarring "0 reviews" before the fetch completes.
  const [rating, setRating] = useState<number>(Number(product.rating ?? 0));
  const [reviewCount, setReviewCount] = useState<number>(Number(product.reviewCount ?? 0));
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/product-reviews?productId=${product.id}&limit=1`, { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        if (typeof data?.count === "number")   setReviewCount(data.count);
        if (typeof data?.average === "number") setRating(data.average);
      })
      .catch(() => { /* keep the prerender values */ });
    return () => { cancelled = true; };
  }, [product.id]);
  const relatedProducts: any[] = product.relatedProducts || [];

  // Display product name — pick the English one when the visitor is
  // reading the site in English (parent server component defaulted
  // to Arabic because it doesn't know the client-persisted locale).
  const displayName =
    isEn
      ? (product.nameEn ?? product.name?.en ?? productName)
      : productName;

  // UI copy dictionary. Every visible label on the product page runs
  // through here so switching the locale modal to English flips the
  // whole page (not just the surrounding chrome). Kept inline instead
  // of the shared i18n dict because the strings are page-specific.
  const L = {
    breadcrumbHome:      isEn ? "Home"                : "الصفحة الرئيسية",
    breadcrumbCategory:  isEn ? "Categories"          : "الأقسام",
    digitalBadge:        isEn ? "Digital product: your order will be delivered electronically"
                              : "منتج رقمي: سيتم تسليم طلبك إلكترونياً بصيغة رقمية",
    viewDescription:     isEn ? "View description"   : "عرض الوصف",
    reviewsCount:        (n: number) => isEn ? `(${n} reviews)` : `(${n} تقييمات)`,
    purchaseCount:       isEn ? "Purchases"          : "عدد مرات الشراء",
    paymentMethodsTitle: isEn ? "Available payment methods" : "طرق الدفع المتاحة",
    payVisa:             isEn ? "Visa"               : "فيزا",
    payMastercard:       isEn ? "Mastercard"         : "ماستركارد",
    payApplePay:         isEn ? "Apple Pay"          : "آبل باي",
    payGooglePay:        isEn ? "Google Pay"         : "G Pay جوجل باي",
    payAmex:             isEn ? "American Express"   : "أمريكان إكسبريس",
    paySecure:           isEn ? "Other 100% secure methods" : "طرق أخرى آمنة 100%",
    supportTitle:        isEn ? "Great support"      : "دعم فني مميز",
    supportBody:         isEn ? "Our team is here to help you around the clock." : "فريقنا جاهز لمساعدتك بكل الأوقات",
    trustedTitle:        isEn ? "Trusted store"      : "متجر موثوق",
    trustedBody:         isEn ? "Great customer experiences and top ratings."    : "تجارب عملاء ممتازة وتقييمات عالية",
    tabDescription:      isEn ? "Description"        : "الوصف",
    tabReviews:          isEn ? "Reviews"            : "التقييمات",
    addToCart:           isEn ? "Add to cart"        : "أضف إلى السلة",
    quantityLabel:       isEn ? "Quantity"           : "الكمية",
    relatedTitle:        isEn ? "Related products"   : "منتجات مشابهة",
    outOfStock:          isEn ? "Out of stock"       : "نفدت الكمية",
    favAdd:              isEn ? "Add to wishlist"    : "إضافة إلى المفضلة",
    favRemove:           isEn ? "Remove from wishlist": "إزالة من المفضلة",
    shareItem:           isEn ? "Share product"      : "مشاركة المنتج",
    shareCopied:         isEn ? "Link copied"        : "تم نسخ الرابط",
    modalClose:          isEn ? "Close"              : "إغلاق",
    modalThanks:         isEn ? "Thank you!"         : "شكراً لك!",
    modalReceived:       isEn ? "Your review has been received and will appear after moderation." : "تم استلام تقييمك وسيظهر بعد المراجعة.",
    modalChecking:       isEn ? "Checking..."        : "جاري التحقق...",
    modalAlreadyRated:   isEn ? "You've reviewed this product" : "لقد قيّمت هذا المنتج",
    modalThanksSharing:  isEn ? "Thanks for sharing your experience." : "شكراً على مشاركتك تجربتك.",
    modalTitle:          isEn ? "Write a review"     : "اكتب تقييماً",
    modalSubtitle:       isEn ? "Share your experience with this product" : "شاركنا تجربتك مع هذا المنتج",
    modalYourRating:     isEn ? "Your rating *"      : "تقييمك *",
    modalYourName:       isEn ? "Your name (optional)" : "اسمك (اختياري)",
    modalNamePh:         isEn ? "e.g. Alex"          : "أحمد",
    modalYourReview:     isEn ? "Your review *"      : "تقييمك *",
    modalReviewPh:       isEn ? "Tell us about your experience..." : "اخبرنا عن تجربتك...",
    modalSubmit:         isEn ? "Submit review"      : "إرسال التقييم",
    modalSending:        isEn ? "Sending..."         : "جاري الإرسال...",
    starsAria:           (n: number) => isEn ? `${n} stars` : `${n} نجوم`,
  };
  // "Added to cart" toast is now global -- see
  // components/layout/CartToast.tsx mounted in Providers. Every call
  // to useCartStore().addItem() fires it, so this page's Add button
  // and the sticky bar both get the same slide-in for free.

  const handleAdd = () => {
    // Belt-and-suspenders: the sticky-bar buttons are already
    // disabled when inStock=false, but a stale client render or a
    // race with an admin toggle could still fire this — refuse.
    if (product.inStock === false) return;
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
    // The global CartToast (mounted in Providers) fires automatically
    // because addItem bumps the toast store; no local trigger needed.
  };

  return (
    <div className="pb-28">
      {/* Breadcrumb.
          On mobile the segments used to wrap MID-WORD (Arabic word
          broken across two lines each), because each Link was
          allowed to soft-wrap and the container was flex-nowrap +
          truncate off. Each label is now `whitespace-nowrap` so it
          stays intact, while the container is `flex-wrap` so the
          longer trailing product-name can drop to its own line
          cleanly. `text-right` keeps the row hugging the RTL start. */}
      <div className="mb-4 flex flex-wrap items-center justify-end gap-x-2 gap-y-1 text-right text-sm text-[#6b7280]">
        <Link href="/" className="whitespace-nowrap hover:text-[#7C3AED]">{L.breadcrumbHome}</Link>
        <span className="whitespace-nowrap">/</span>
        {product.category && (
          <>
            <Link
              href={`/collections/${product.category.slug}`}
              className="whitespace-nowrap hover:text-[#7C3AED]"
            >
              {isEn
                ? (product.category.nameEn ?? product.category.name?.en ?? product.category.nameAr ?? product.category.name?.ar ?? L.breadcrumbCategory)
                : (product.category.nameAr ?? product.category.name?.ar ?? L.breadcrumbCategory)}
            </Link>
            <span className="whitespace-nowrap">/</span>
          </>
        )}
        <span className="font-medium text-[#1e1b4b]">{displayName}</span>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">

        {/* Info column — LEFT side on desktop (RTL end) per the reference:
            product illustration lives on the right, details flow on the
            left where the eye lands next in the RTL reading order. */}
        <div className="order-2 space-y-5 lg:order-2">

          {/* Title + actions */}
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-xl font-black leading-snug text-[#1e1b4b] md:text-2xl">
              {displayName}
            </h1>
            <div className="flex shrink-0 gap-2">
              {/* Wishlist toggle -- reads the same store the header
                  wishlist badge does. Fills the heart red when active. */}
              <button
                type="button"
                onClick={() => toggleFav(product as Product)}
                aria-label={isFav ? L.favRemove : L.favAdd}
                aria-pressed={isFav}
                className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors ${
                  isFav
                    ? "bg-[#FEE2E2] text-[#DC2626] hover:bg-[#FECACA]"
                    : "bg-[#EDE9FE] text-[#7C3AED] hover:bg-[#ddd6fe]"
                }`}
              >
                <Heart className={`h-4 w-4 ${isFav ? "fill-current" : ""}`} />
              </button>
              {/* Share -- Web Share API on mobile, clipboard on desktop.
                  Shows a small "تم النسخ" tick for 1.5s after clipboard copy. */}
              <button
                type="button"
                onClick={handleShare}
                aria-label={shareCopied ? L.shareCopied : L.shareItem}
                title={shareCopied ? L.shareCopied : L.shareItem}
                className="flex h-10 w-10 items-center justify-center rounded-full bg-[#EDE9FE] text-[#7C3AED] transition-colors hover:bg-[#ddd6fe]"
              >
                {shareCopied ? (
                  <BadgeCheck className="h-4 w-4" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#f5f3ff] px-3 py-1 text-xs font-medium text-[#6b7280]">
              📱 {L.digitalBadge}
            </span>
            <button
              onClick={() => {
                document.getElementById("product-tabs")?.scrollIntoView({ behavior: "smooth" });
                setTab("desc");
              }}
              className="rounded-full bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-3 py-1 text-xs font-bold text-white"
            >
              {L.viewDescription}
            </button>
          </div>

          {/* Rating + Price */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1">
              {/* Rating comes back from /api/product-reviews as a float
                  (e.g. 4.3). Round to the nearest whole star so the row
                  reads clean; the exact value is still visible in the
                  reviews list below. */}
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(rating) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                />
              ))}
              <span className="mr-1 text-xs text-[#6b7280]">{L.reviewsCount(reviewCount)}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-black text-[#7C3AED]">
                {formatPrice(product.price, product.currency, userCurrency, rates, lang)}
              </span>
              {hasDiscount && (
                <span className="text-sm text-[#9ca3af] line-through">
                  {formatPrice(product.comparePrice, product.currency, userCurrency, rates, lang)}
                </span>
              )}
            </div>
          </div>

          {/* Purchase count card */}
          <div className="flex items-center justify-between rounded-2xl border border-[#ddd6fe] bg-[#f5f3ff] px-4 py-3">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-4 w-4 text-[#7C3AED]" />
              <span className="text-sm text-[#4c1d95]">{L.purchaseCount}</span>
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

          {/* Payment methods + trust block — merged into ONE gradient
              card per the reference design. Payment pills carry small
              brand-colored mark tiles instead of emojis so the block
              reads like a real payment strip; a hairline divider
              separates the payment list from the support / trusted
              cards below. */}
          {/* dir flips the whole card's alignment: RTL (Arabic) packs
              the title + pills + feature glyphs to the right; LTR
              (English) mirrors them to the left. `text-start` /
              `justify-start` are logical, so they follow the dir. */}
          <div
            dir={isEn ? "ltr" : "rtl"}
            className="overflow-hidden rounded-[28px] bg-gradient-to-l from-[#9c65fa] via-[#7C3AED] to-[#6D28D9] p-6 text-white shadow-[0_18px_40px_rgba(124,58,237,0.3)]"
          >
            <div className="mb-4 text-start text-sm font-black">{L.paymentMethodsTitle}</div>
            <div className="flex flex-wrap justify-start gap-2.5 text-xs">
              <PaymentPill label={L.payVisa}       mark={<i className="fa-brands fa-cc-visa text-[15px] leading-none" />} />
              <PaymentPill label={L.payMastercard} mark={<i className="fa-brands fa-cc-mastercard text-[15px] leading-none" />} />
              <PaymentPill label={L.payApplePay}   mark={<i className="fa-brands fa-apple-pay text-[16px] leading-none" />} />
              <PaymentPill label={L.payGooglePay}  mark={<i className="fa-brands fa-google-pay text-[16px] leading-none" />} />
              <PaymentPill label={L.payAmex}       mark={<i className="fa-brands fa-cc-amex text-[15px] leading-none" />} />
              <PaymentPill label={L.paySecure}     mark={<i className="fa-solid fa-shield-halved text-[13px] leading-none" />} />
            </div>

            {/* Hairline divider between payment methods and trust
                strip. bg-white/20 reads as a soft rule against the
                gradient without introducing a hard color. */}
            <div className="my-5 h-px w-full bg-white/20" />

            {/* Support + trusted-store row. Each heading pairs a small
                Font Awesome glyph with the title on the reading start
                (right in AR, left in EN). */}
            <div className="grid grid-cols-2 gap-4">
              <div className="text-start">
                <div className="mb-1 flex items-center justify-start gap-2">
                  <span className="text-sm font-black">{L.supportTitle}</span>
                  <i className="fa-solid fa-headset shrink-0 text-[14px] text-white" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/75">{L.supportBody}</p>
              </div>
              <div className="text-start">
                <div className="mb-1 flex items-center justify-start gap-2">
                  <span className="text-sm font-black">{L.trustedTitle}</span>
                  <i className="fa-solid fa-star shrink-0 text-[14px] text-white" />
                </div>
                <p className="text-[11px] leading-relaxed text-white/75">{L.trustedBody}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Image column — RIGHT side on desktop (RTL start).
            Frame removed: was `rounded-2xl bg-[#f5f3ff] p-6` which
            drew a light lavender box around every artwork and forced
            padding inset even for full-bleed key art. The image now
            sits directly on the page background so it reads as the
            hero it is. Empty-state placeholder still gets a soft
            background so the "no image yet" square is visible. */}
        <div className="order-1 space-y-3 lg:order-1">
          {/* Soft rounding only -- `rounded-xl` (12px) keeps the artwork
              feeling like a page hero rather than a heavily-framed card,
              while smoothing the hard right-angle corners we had after
              removing the lavender frame. Thumbnails get the same treatment
              at rounded-lg so the corner language stays consistent. */}
          <div className="relative aspect-square overflow-hidden rounded-xl">
            {product.images?.[0]?.image?.url ? (
              <Image
                src={product.images[0].image.url}
                alt={displayName}
                fill
                className="object-contain"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center bg-[#f5f3ff] text-6xl">📦</div>
            )}
          </div>
          {product.images?.length > 1 && (
            <div className="grid grid-cols-4 gap-2">
              {product.images.slice(1, 5).map((img: any, i: number) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-lg">
                  <Image src={img.image?.url || ""} alt="" fill className="object-contain" />
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
            {L.tabDescription}
          </button>
          <button
            onClick={() => setTab("reviews")}
            className={`rounded-full px-6 py-2 text-sm font-bold transition-colors ${
              tab === "reviews"
                ? "bg-gradient-to-r from-[#7C3AED] to-[#9333EA] text-white shadow-md"
                : "border border-[#ddd6fe] bg-white text-[#7C3AED]"
            }`}
          >
            {L.tabReviews}
          </button>
        </div>

        {tab === "desc" ? (
          <div className="rounded-2xl border border-[#e8e4f8] bg-white p-6">
            {(() => {
              // English visitors get descriptionHtmlEn when the editor
              // filled it, falling back to the Arabic descriptionHtml
              // (then the lexical richText) so a half-translated product
              // still shows *something*. Arabic visitors always see
              // descriptionHtml.
              const arHtml = (product as any).descriptionHtml || lexicalToHtml(product.description);
              const enHtml = (product as any).descriptionHtmlEn as string | undefined;
              const html = isEn && enHtml ? enHtml : arHtml;
              return html ? (
                <div
                  className={`prose prose-sm max-w-none ${isEn ? "text-left" : "text-right"}`}
                  dir={isEn ? "ltr" : "rtl"}
                  dangerouslySetInnerHTML={{ __html: html }}
                />
              ) : (
                <p className="text-center text-sm text-[#6b7280]">
                  {isEn ? "No detailed description for this product." : "لا يوجد وصف مفصل لهذا المنتج."}
                </p>
              );
            })()}
          </div>
        ) : (
          <ProductReviews
            productId={Number(product.id)}
            isEn={isEn}
            onWriteReview={() => setReviewOpen(true)}
          />
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
              aria-label={L.modalClose}
            >
              <X className="h-4 w-4" strokeWidth={2.5} />
            </button>

            {reviewSubmitted ? (
              /* Success state */
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <BadgeCheck className="h-8 w-8 text-[#16A34A]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-[#1e1b4b]">{L.modalThanks}</h3>
                <p className="text-sm text-[#6b7280]">
                  {L.modalReceived}
                </p>
              </div>
            ) : !reviewStatus.checked ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <Loader2 className="h-6 w-6 animate-spin text-[#7C3AED]" />
                <p className="text-xs text-[#6b7280]">{L.modalChecking}</p>
              </div>
            ) : reviewStatus.existingRating ? (
              <div className="flex flex-col items-center gap-3 py-8 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#DCFCE7]">
                  <BadgeCheck className="h-8 w-8 text-[#16A34A]" strokeWidth={2.5} />
                </div>
                <h3 className="text-lg font-black text-[#1e1b4b]">{L.modalAlreadyRated}</h3>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Star
                      key={i}
                      className={`h-6 w-6 ${
                        i <= (reviewStatus.existingRating ?? 0)
                          ? "fill-[#F59E0B] text-[#F59E0B]"
                          : "text-[#D1D5DB]"
                      }`}
                      strokeWidth={1.5}
                    />
                  ))}
                </div>
                <p className="text-xs text-[#6b7280]">{L.modalThanksSharing}</p>
              </div>
            ) : (
              <>
                <h3 className="mb-1 text-lg font-black text-[#1e1b4b]">{L.modalTitle}</h3>
                <p className="mb-5 text-xs text-[#6b7280]">{L.modalSubtitle}</p>

                {/* Star rating selector */}
                <label className="mb-2 block text-xs font-bold text-[#1e1b4b]">
                  {L.modalYourRating}
                </label>
                <div className="mb-4 flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setReviewRating(i)}
                      className="p-1 transition-transform hover:scale-110 active:scale-95"
                      aria-label={L.starsAria(i)}
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
                  {L.modalYourName}
                </label>
                <input
                  type="text"
                  value={reviewName}
                  onChange={(e) => setReviewName(e.target.value)}
                  placeholder={L.modalNamePh}
                  className="mb-4 w-full rounded-xl border border-[#ddd6fe] bg-white px-4 py-2.5 text-sm text-[#1e1b4b] outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />

                {/* Review text */}
                <label className="mb-2 block text-xs font-bold text-[#1e1b4b]">
                  {L.modalYourReview}
                </label>
                <textarea
                  value={reviewText}
                  onChange={(e) => setReviewText(e.target.value)}
                  placeholder={L.modalReviewPh}
                  rows={4}
                  className="mb-5 w-full resize-none rounded-xl border border-[#ddd6fe] bg-white px-4 py-2.5 text-sm text-[#1e1b4b] outline-none transition-all focus:border-[#7C3AED] focus:ring-2 focus:ring-[#7C3AED]/20"
                />

                {reviewError && (
                  <div className="mb-3 rounded-xl border border-[#fecaca] bg-[#fef2f2] px-3 py-2 text-xs font-bold text-[#991b1b]">
                    {reviewError}
                  </div>
                )}

                <button
                  onClick={handleSubmitReview}
                  disabled={!reviewRating || !reviewText.trim() || reviewSubmitting}
                  className="w-full rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] py-3 text-sm font-black text-white shadow-md transition-all hover:scale-[1.01] hover:shadow-lg active:scale-95 disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:scale-100"
                >
                  {reviewSubmitting ? L.modalSending : L.modalSubmit}
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-10">
          <h2 className="mb-5 text-center text-lg font-black text-[#1e1b4b]">{L.relatedTitle}</h2>
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
                  {formatPrice(related.price, related.currency, userCurrency, rates, lang)}
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
        {/* Mobile floating bar — thick WHITE border on the outer edge,
            18px radius, and a neon purple glow. The white outline is
            the bar's own border now (no inner outlined pill), matching
            the reference. */}
        <div
          className="mx-3 mb-3 flex items-center justify-between gap-2 rounded-[18px] border-[3px] border-white bg-gradient-to-l from-[#9c65fa] to-[#7C3AED] px-2.5 py-2 shadow-[0_0_16px_rgba(156,101,250,0.9),0_0_34px_rgba(124,58,237,0.6)] sm:hidden"
          dir="rtl"
        >
            {/* Add to cart pill — flips to "Out of stock" (LTR) when
                inStock=false. */}
            <button
              onClick={inStock ? handleAdd : undefined}
              disabled={!inStock}
              className={`inline-flex flex-1 items-center justify-center gap-1.5 rounded-full bg-white px-3 py-2.5 text-sm font-black shadow-sm transition-all ${inStock ? "text-[#5B21B6] active:scale-95" : "cursor-not-allowed text-[#6b7280]"}`}
            >
              <ShoppingCart className={`h-4 w-4 ${inStock ? "text-[#7C3AED]" : "text-[#9ca3af]"}`} strokeWidth={2.5} />
              {inStock ? (
                <span>{L.addToCart}</span>
              ) : (
                <span dir="ltr">Out of stock</span>
              )}
            </button>

            {/* Quantity — label outside the white pill, on the gradient. */}
            <div className="flex shrink-0 items-center gap-1.5 text-white">
              <div className="flex items-center gap-0.5 rounded-full bg-white px-1 py-0.5">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[#7C3AED] transition-colors hover:bg-[#EDE9FE]"
                  aria-label="ناقص"
                >
                  <Minus className="h-3.5 w-3.5" strokeWidth={2.5} />
                </button>
                <span className="min-w-[1.4rem] text-center text-sm font-black text-[#5B21B6]">
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
              <span className="text-xs font-bold opacity-90">{L.quantityLabel}</span>
            </div>
        </div>

        {/* Desktop bar — matches reference:
             • Buttons live in a white-outlined pill container on the LEFT
               (RTL end), NOT centered.
             • Quantity sits on the RIGHT (RTL start) with the "الكمية"
               label INLINE beside the -/1/+ pill (not stacked above). */}
        <div className="hidden border-t border-white/10 bg-gradient-to-r from-[#7C3AED] to-[#9333EA] sm:block">
          <div
            className="mx-auto flex max-w-[90rem] items-center gap-3 px-4 py-3"
            dir="rtl"
          >
            {/* Single white-outlined pill holds EVERYTHING. Groups are
                pushed to the two edges via justify-between: label + qty
                cluster pinned to the RTL start (right), action buttons
                pinned to the RTL end (left). Equal 5rem left/right
                padding keeps the corner buttons symmetric; thicker
                border-2 per design feedback. */}
            <div className="flex flex-1 items-center justify-between gap-3 rounded-2xl border-2 border-white/50 bg-transparent px-20 py-2">
              {/* Right-edge group: label + qty control */}
              <div className="flex items-center gap-3">
                <span className="shrink-0 text-sm font-bold text-white/90">الكمية</span>
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

              {/* Left-edge group: action buttons */}
              <div className="flex items-center gap-3">
                <button
                  onClick={inStock ? handleAdd : undefined}
                  disabled={!inStock}
                  className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-black shadow-sm transition-all ${inStock ? "text-[#5B21B6] hover:bg-[#FAF5FF] hover:scale-[1.02] active:scale-95" : "cursor-not-allowed text-[#6b7280]"}`}
                >
                  <ShoppingCart className={`h-4 w-4 ${inStock ? "text-[#7C3AED]" : "text-[#9ca3af]"}`} strokeWidth={2.5} />
                  {inStock ? (
                    <span>{L.addToCart}</span>
                  ) : (
                    <span dir="ltr">Out of stock</span>
                  )}
                </button>
                <button
                  onClick={inStock ? handleAdd : undefined}
                  disabled={!inStock}
                  className={`inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-base font-black shadow-sm transition-all ${inStock ? "text-[#5B21B6] hover:bg-[#FAF5FF] hover:scale-[1.02] active:scale-95" : "cursor-not-allowed text-[#6b7280]"}`}
                >
                  <Zap className={`h-4 w-4 ${inStock ? "text-orange-500" : "text-[#9ca3af]"}`} strokeWidth={2.5} fill="currentColor" />
                  <span>اشتري الآن</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   Approved-reviews list for the "التقييمات" tab. Fetches from
   /api/product-reviews (which filters status = 'approved' server-side)
   so pending or rejected reviews never surface here. Auto-source
   entries (from the 7-day sweep) are labeled but still counted.
═══════════════════════════════════════════════════════════════════ */
type PublicReview = {
  id: number;
  rating: number;
  comment: string | null;
  reviewerName: string;
  source: string;
  createdAt: string;
};

function ProductReviews({
  productId,
  isEn,
  onWriteReview,
}: {
  productId: number;
  isEn: boolean;
  onWriteReview: () => void;
}) {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ count: number; average: number; reviews: PublicReview[] }>({
    count: 0, average: 0, reviews: [],
  });

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetch(`/api/product-reviews?productId=${productId}`, { cache: "no-store" })
      .then((r) => r.ok ? r.json() : { count: 0, average: 0, reviews: [] })
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [productId]);

  const heading = isEn ? "Customer reviews" : "تقييمات العملاء";
  const writeBtn = isEn ? "Write a review" : "يكتب تقييم";
  const emptyTitle = isEn ? "No reviews yet." : "لا يوجد أي تقييمات.";
  const emptyBody = isEn ? "Be the first to review this product" : "كن أول من يكتب تقييماً لهذا المنتج";
  const autoLabel = isEn ? "auto" : "تلقائي";

  return (
    <div className="rounded-2xl border border-[#e8e4f8] bg-[#FAFAFC] p-6" dir={isEn ? "ltr" : "rtl"}>
      <div className="mb-6 flex items-center justify-between gap-3">
        <h2 className="text-lg font-black text-[#1e1b4b]">{heading}</h2>
        {data.count > 0 && (
          <div className="flex items-center gap-2 text-sm">
            <span className="flex items-center gap-0.5">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.round(data.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                  strokeWidth={2}
                />
              ))}
            </span>
            <span className="font-bold text-brand-800">{data.average.toFixed(1)}</span>
            <span className="text-xs text-gray-500">({data.count})</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-brand-500" />
        </div>
      ) : data.reviews.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-[#e8e4f8] bg-white px-6 py-12 text-center">
          <div className="flex items-center gap-1.5">
            {[1, 2, 3, 4, 5].map((i) => (
              <Star key={i} className="h-7 w-7 text-[#D1D5DB]" strokeWidth={1.5} />
            ))}
          </div>
          <p className="mt-2 text-sm font-semibold text-[#1e1b4b]">{emptyTitle}</p>
          <p className="text-sm text-[#6b7280]">{emptyBody}</p>
          <button
            onClick={onWriteReview}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#9333EA] px-6 py-2.5 text-sm font-black text-white shadow-md transition-all hover:scale-[1.02] hover:shadow-lg active:scale-95"
          >
            <PenLine className="h-4 w-4" strokeWidth={2.5} />
            <span>{writeBtn}</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {data.reviews.map((r) => (
            <div key={r.id} className="rounded-2xl border border-[#e8e4f8] bg-white p-4">
              <div className="mb-2 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        className={`h-3.5 w-3.5 ${i < r.rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
                        strokeWidth={2}
                      />
                    ))}
                  </span>
                  <span className="text-sm font-bold text-brand-800">{r.reviewerName}</span>
                  {r.source === "auto" && (
                    <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                      {autoLabel}
                    </span>
                  )}
                </div>
                <span className="text-xs text-gray-400" dir="ltr">
                  {new Date(r.createdAt).toLocaleDateString(isEn ? "en-US" : "ar-EG-u-nu-latn", {
                    day: "numeric", month: "short", year: "numeric",
                  })}
                </span>
              </div>
              {r.comment && <p className="text-sm leading-relaxed text-gray-700">{r.comment}</p>}
            </div>
          ))}
          <button
            onClick={onWriteReview}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border-2 border-brand-200 bg-white px-6 py-3 text-sm font-black text-brand-700 transition-all hover:bg-brand-50"
          >
            <PenLine className="h-4 w-4" strokeWidth={2.5} />
            <span>{writeBtn}</span>
          </button>
        </div>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────
   Payment method helpers
   Small inline brand marks + a shared pill wrapper. Kept in this
   file (rather than a shared components/) because only the product
   page renders them today; if another surface needs them they can
   be lifted out unchanged. Each mark is a tiny <span> or SVG so we
   don't pull in an icon library or ship binary assets.
   ────────────────────────────────────────────────────────────*/

function PaymentPill({ label, mark }: { label: string; mark: React.ReactNode }) {
  // Text first, then mark. In an RTL context (which the whole page
  // inherits), flex renders the FIRST child at the start (right in
  // RTL) so the label sits on the right of the pill and the brand
  // mark sits at the left/trailing edge -- matches the reference
  // where "فيزا [VISA]" reads text-then-icon.
  return (
    <span className="inline-flex items-center gap-2 rounded-full bg-[rgb(254_254_254/0.12)] px-3.5 py-2 text-white ring-1 ring-[rgb(254_254_254/0.12)] backdrop-blur-[2px]">
      <span className="text-[11px] font-semibold leading-none">{label}</span>
      <span className="flex h-5 w-5 shrink-0 items-center justify-center">
        {mark}
      </span>
    </span>
  );
}

