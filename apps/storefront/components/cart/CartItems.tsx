"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { useEffect, useState } from "react";
import { Trash2, Plus, Minus, AlertCircle, ArrowRight } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLocaleStore } from "@/lib/locale-store";
import { formatPrice } from "@/lib/utils";
import { DiscountCodeInput } from "@/components/cart/DiscountCodeInput";
import { useT } from "@/lib/i18n";
import type { DeliveryField } from "@my-store/types";

/**
 * Per-unit delivery-field key. When quantity > 1 each unit needs its
 * own set of delivery inputs (e.g. an email/number asked once per
 * copy). Unit 0 keeps the bare field id for back-compat with values
 * captured on the product page + single-quantity carts; units 1+ get
 * a "#<n>" suffix.
 */
function unitKey(fieldId: string, unit: number): string {
  return unit === 0 ? fieldId : `${fieldId}#${unit}`;
}

/** Required keys still empty, checked across every unit of the item. */
function getMissingRequired(
  fields: DeliveryField[],
  info: Record<string, string> | undefined,
  quantity: number,
): string[] {
  const missing: string[] = [];
  const units = Math.max(1, quantity || 1);
  for (let u = 0; u < units; u++) {
    for (const f of fields) {
      if (!f.required) continue;
      const k = unitKey(f.id || "0", u);
      if (!info?.[k]?.trim()) missing.push(k);
    }
  }
  return missing;
}

export function CartItems() {
  const { items, removeItem, updateQuantity, updateDeliveryInfo, totalPrice, totalAfterDiscount, appliedDiscount, clearCart } =
    useCartStore();
  const { t, dir, isEn } = useT();
  const { currency: userCurrency, rates, lang } = useLocaleStore();

  // Live stock check: the cart holds a snapshot of the product at
  // add-time, so we need to ask the server for the current inStock
  // state per item on mount. Any product marked out of stock since
  // it was added shows an inline warning + blocks checkout.
  const [liveStock, setLiveStock] = useState<Record<string, boolean>>({});
  useEffect(() => {
    const ids = items.map((i) => String(i.product.id));
    if (ids.length === 0) { setLiveStock({}); return; }
    let cancelled = false;
    fetch("/api/cart/stock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids }),
    })
      .then((r) => r.ok ? r.json() : { stock: {} })
      .then((data: { stock?: Record<string, boolean> }) => {
        if (!cancelled) setLiveStock(data.stock ?? {});
      })
      .catch(() => {});
    return () => { cancelled = true; };
    // Re-run when the set of item IDs changes (add/remove).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items.map((i) => i.product.id).join(",")]);

  const isOutOfStock = (id: string | number) => liveStock[String(id)] === false;
  const anyOutOfStock = items.some((i) => isOutOfStock(i.product.id));

  if (items.length === 0) {
    return (
      <div className="brand-card py-16 text-center" dir={dir}>
        <span className="text-6xl">🛒</span>
        <h2 className="mt-4 text-xl font-bold text-brand-800">
          {t("cartEmpty")}
        </h2>
        <p className="mt-2 text-gray-500">{t("cartEmptyHint")}</p>
        <Link href="/products" className="brand-btn mt-6 inline-block">
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  const canCheckout = !anyOutOfStock && items.every((item) => {
    const fields: DeliveryField[] = (item.product as any).deliveryFields || [];
    return getMissingRequired(fields, item.deliveryInfo, item.quantity).length === 0;
  });

  return (
    <div className="space-y-4">
      {/* Back / continue shopping */}
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800"
        dir={dir}
      >
        <ArrowRight className="h-4 w-4 rtl:rotate-0 ltr:rotate-180" strokeWidth={2.5} />
        <span>{isEn ? "Continue shopping" : "متابعة التسوق"}</span>
      </Link>

      {items.map((item) => {
        const imageUrl = item.product.images?.[0]?.image?.url;
        const deliveryFields: DeliveryField[] = (item.product as any).deliveryFields || [];
        const missingKeys = getMissingRequired(deliveryFields, item.deliveryInfo, item.quantity);
        const hasUnfilled = missingKeys.length > 0;
        const units = Math.max(1, item.quantity || 1);

        const oos = isOutOfStock(item.product.id);

        return (
          <div key={item.product.id} className={`brand-card relative space-y-4 ${oos ? "border-2 border-red-200 bg-red-50/40" : ""}`}>
            {/* Trash absolutely-positioned in the trailing corner so
                it can't push the flex row off-screen on narrow phones. */}
            <button
              onClick={() => removeItem(item.product.id)}
              aria-label={isEn ? "Remove" : "إزالة"}
              className="absolute end-2 top-2 z-10 rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </button>

            {/* Out-of-stock banner — shown when the CMS marks the
                product OOS AFTER it was added to the cart. Prompts
                the visitor to remove it before checkout. */}
            {oos && (
              <div className="flex items-start gap-2 rounded-xl bg-red-100 px-3 py-2 text-sm text-red-800" dir={dir}>
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <p>
                  {isEn
                    ? "This product just went out of stock. Please remove it to continue."
                    : "أصبح هذا المنتج غير متوفر في المخزون. يرجى إزالته للمتابعة."}
                </p>
              </div>
            )}

            {/* Row wraps on mobile: image + info on line 1, quantity +
                subtotal on line 2 (or same line on ≥sm). */}
            <div className="flex flex-wrap items-center gap-4 pe-8">
              {/* Image */}
              <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-xl bg-brand-50">
                {imageUrl ? (
                  <Image
                    src={imageUrl}
                    alt={(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                    fill
                    className="object-contain p-2"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-2xl">📦</div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="line-clamp-2 text-sm font-bold text-brand-800 hover:text-brand-500"
                >
                  {(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                </Link>
                <p className="mt-1 text-sm font-semibold text-brand-600">
                  {formatPrice(item.product.price, item.product.currency, userCurrency, rates, lang)}
                </p>
                {/* Filled delivery info summary — one group per unit
                    when quantity > 1. */}
                {item.deliveryInfo && deliveryFields.length > 0 && !hasUnfilled && (
                  <div className="mt-2 space-y-1.5">
                    {Array.from({ length: units }).map((_, u) => (
                      <div key={u} className="space-y-0.5">
                        {units > 1 && (
                          <p className="text-[11px] font-bold text-brand-500">
                            {isEn ? `Copy ${u + 1}` : `النسخة ${u + 1}`}
                          </p>
                        )}
                        {deliveryFields.map((field, idx) => {
                          const key = unitKey(field.id || String(idx), u);
                          const value = item.deliveryInfo?.[key];
                          if (!value) return null;
                          return (
                            <p key={key} className="text-xs text-gray-500">
                              <span className="font-medium text-brand-700">
                                {isEn && field.labelEn ? field.labelEn : field.labelAr}:
                              </span>{" "}
                              {value}
                            </p>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Quantity + subtotal — wrap to a new line on narrow
                  screens so they never squeeze the trash off-canvas. */}
              <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
                <div className="flex items-center gap-2 rounded-xl border border-brand-100 p-1">
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                    className="rounded-lg p-1 hover:bg-brand-50"
                  >
                    <Minus className="h-4 w-4 text-brand-600" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-bold text-brand-800">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                    className="rounded-lg p-1 hover:bg-brand-50"
                  >
                    <Plus className="h-4 w-4 text-brand-600" />
                  </button>
                </div>

                <div className="min-w-[5rem] text-end">
                  <span className="text-sm font-bold text-brand-600">
                    {formatPrice(item.product.price * item.quantity, item.product.currency, userCurrency, rates, lang)}
                  </span>
                </div>
              </div>
            </div>

            {/* Delivery fields form — always visible when the product has
                any delivery fields (was previously gated on `hasUnfilled`,
                which unmounted the entire block the moment the visitor
                typed the first character into a required field, making
                it impossible to type more than one). The amber warning
                banner still toggles based on `hasUnfilled` so once every
                required field is filled it fades to a neutral card. */}
            {deliveryFields.length > 0 && (
              <div
                className={`rounded-2xl border p-4 ${
                  hasUnfilled ? "border-amber-200 bg-amber-50" : "border-[#e8e4f8] bg-white"
                }`}
                dir={isEn ? "ltr" : "rtl"}
              >
                {hasUnfilled && (
                  <div className="mb-3 flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-amber-600" />
                    <p className="text-sm font-semibold text-amber-800">
                      {isEn ? "Please complete the delivery info for this item" : "يرجى إكمال معلومات التسليم لهذا المنتج"}
                    </p>
                  </div>
                )}
                {/* One block of delivery fields PER UNIT. If the cart
                    holds 2 of a product whose delivery field asks for a
                    number/email, the customer fills it twice — once per
                    copy — and each copy is stored under its own key. */}
                <div className="space-y-4">
                  {Array.from({ length: units }).map((_, u) => (
                    <div key={u} className={units > 1 ? "rounded-xl border border-[#e8e4f8] bg-brand-50/40 p-3" : ""}>
                      {units > 1 && (
                        <p className="mb-2 text-xs font-bold text-brand-600">
                          {isEn ? `Copy ${u + 1} of ${units}` : `النسخة ${u + 1} من ${units}`}
                        </p>
                      )}
                      <div className="space-y-3">
                        {deliveryFields.map((field, idx) => {
                          const key = unitKey(field.id || String(idx), u);
                          const hasError = missingKeys.includes(key);
                          const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm text-[#1e1b4b] placeholder:text-[#9ca3af] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#ddd6fe] bg-white ${hasError ? "border-red-400" : "border-[#e8e4f8]"}`;
                          const setValue = (val: string) =>
                            updateDeliveryInfo(item.product.id, {
                              ...(item.deliveryInfo || {}),
                              [key]: val,
                            });

                          return (
                            <div key={key}>
                              <label className="mb-1 block text-sm font-medium text-[#1e1b4b]">
                                {isEn && field.labelEn ? field.labelEn : field.labelAr}
                                {field.required && <span className="text-red-500"> *</span>}
                              </label>
                              {field.helpText && (
                                <p className="mb-1 text-xs text-[#6b7280]">{field.helpText}</p>
                              )}
                              {field.fieldType === "select" ? (
                                <select
                                  value={item.deliveryInfo?.[key] || ""}
                                  onChange={(e) => setValue(e.target.value)}
                                  className={inputClass}
                                >
                                  <option value="">{isEn ? "-- Please select --" : "-- الرجاء التحديد --"}</option>
                                  {(field.selectOptions || "")
                                    .split(",")
                                    .map((o) => o.trim())
                                    .filter(Boolean)
                                    .map((opt) => (
                                      <option key={opt} value={opt}>
                                        {opt}
                                      </option>
                                    ))}
                                </select>
                              ) : (
                                <input
                                  type={
                                    field.fieldType === "tel"
                                      ? "tel"
                                      : field.fieldType === "email"
                                      ? "email"
                                      : "text"
                                  }
                                  value={item.deliveryInfo?.[key] || ""}
                                  onChange={(e) => setValue(e.target.value)}
                                  placeholder={field.placeholder || ""}
                                  className={inputClass}
                                  dir={
                                    field.fieldType === "tel" || field.fieldType === "email"
                                      ? "ltr"
                                      : undefined
                                  }
                                />
                              )}
                              {hasError && (
                                <p className="mt-1 text-xs text-red-500">{isEn ? "This field is required" : "هذا الحقل مطلوب"}</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Summary */}
      <div className="brand-card space-y-3">
        <DiscountCodeInput />
        {appliedDiscount && (
          <div className="flex items-center justify-between text-sm text-gray-600" dir="rtl">
            <span>{t("subtotal")}</span>
            <span style={{ fontFeatureSettings: '"tnum"' }}>
              {formatPrice(totalPrice(), "USD", userCurrency, rates, lang)}
            </span>
          </div>
        )}
        {appliedDiscount && (
          <div className="flex items-center justify-between text-sm text-green-600" dir="rtl">
            <span>خصم ({appliedDiscount.code})</span>
            <span style={{ fontFeatureSettings: '"tnum"' }}>
              −{formatPrice(appliedDiscount.amount, "USD", userCurrency, rates, lang)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-800">{t("total")}</span>
          <span className="text-2xl font-extrabold text-brand-600" style={{ fontFeatureSettings: '"tnum"' }}>
            {formatPrice(totalAfterDiscount(), "USD", userCurrency, rates, lang)}
          </span>
        </div>
        {anyOutOfStock ? (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2.5 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {isEn
              ? "Some products in your cart are out of stock. Please remove them before proceeding."
              : "بعض المنتجات في السلة غير متوفرة في المخزون. يرجى إزالتها قبل المتابعة."}
          </p>
        ) : !canCheckout && (
          <p className="mt-3 flex items-center gap-2 rounded-xl bg-amber-50 px-4 py-2.5 text-sm text-amber-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {isEn ? "Please complete the delivery info for all products before proceeding" : "يرجى إكمال معلومات التسليم لجميع المنتجات قبل المتابعة"}
          </p>
        )}
        <div className="mt-4 flex gap-3">
          {canCheckout ? (
            <Link href="/checkout" className="brand-btn flex-1 text-center">
              {t("checkout")}
            </Link>
          ) : (
            <button
              disabled
              className="brand-btn flex-1 cursor-not-allowed text-center opacity-50"
            >
              {t("checkout")}
            </button>
          )}
          <button onClick={clearCart} className="brand-btn-outline px-4 text-sm">
            {t("emptyCart")}
          </button>
        </div>
      </div>
    </div>
  );
}
