"use client";

import Image from "next/image";
import Link from "@/components/ui/link";
import { Trash2, Plus, Minus, AlertCircle } from "lucide-react";
import { useCartStore } from "@/lib/store";
import { useLocaleStore } from "@/lib/locale-store";
import { formatPrice } from "@/lib/utils";
import { DiscountCodeInput } from "@/components/cart/DiscountCodeInput";
import { useT } from "@/lib/i18n";
import type { DeliveryField } from "@my-store/types";

function getMissingRequired(fields: DeliveryField[], info: Record<string, string> | undefined): string[] {
  return fields
    .filter((f) => f.required && !info?.[f.id || "0"]?.trim())
    .map((f) => f.id || "0");
}

export function CartItems() {
  const { items, removeItem, updateQuantity, updateDeliveryInfo, totalPrice, totalAfterDiscount, appliedDiscount, clearCart } =
    useCartStore();
  const { t, dir, isEn } = useT();
  // Same visitor-picked currency the home/product pages use, so the
  // cart doesn't suddenly flip back to USD after being shown SAR/JOD/AED
  // everywhere else. Line-item, subtotal, and cart total all reformat
  // via `formatPrice(amt, "USD", userCurrency, rates)`.
  const { currency: userCurrency, rates } = useLocaleStore();

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

  const canCheckout = items.every((item) => {
    const fields: DeliveryField[] = (item.product as any).deliveryFields || [];
    return getMissingRequired(fields, item.deliveryInfo).length === 0;
  });

  return (
    <div className="space-y-4">
      {items.map((item) => {
        const imageUrl = item.product.images?.[0]?.image?.url;
        const deliveryFields: DeliveryField[] = (item.product as any).deliveryFields || [];
        const missingKeys = getMissingRequired(deliveryFields, item.deliveryInfo);
        const hasUnfilled = missingKeys.length > 0;

        return (
          <div key={item.product.id} className="brand-card space-y-4">
            <div className="flex items-center gap-4">
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
              <div className="flex-1">
                <Link
                  href={`/products/${item.product.slug}`}
                  className="text-sm font-bold text-brand-800 hover:text-brand-500"
                >
                  {(item.product as any).nameAr ?? item.product.name?.ar ?? ""}
                </Link>
                <p className="mt-1 text-sm font-semibold text-brand-600">
                  {formatPrice(item.product.price, item.product.currency, userCurrency, rates)}
                </p>
                {/* Filled delivery info summary */}
                {item.deliveryInfo && deliveryFields.length > 0 && !hasUnfilled && (
                  <div className="mt-2 space-y-0.5">
                    {deliveryFields.map((field, idx) => {
                      const key = field.id || String(idx);
                      const value = item.deliveryInfo?.[key];
                      if (!value) return null;
                      return (
                        <p key={key} className="text-xs text-gray-500">
                          <span className="font-medium text-brand-700">{field.labelAr}:</span>{" "}
                          {value}
                        </p>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Quantity */}
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

              {/* Subtotal */}
              <div className="min-w-[5rem] text-left">
                <span className="text-sm font-bold text-brand-600">
                  {formatPrice(item.product.price * item.quantity, item.product.currency, userCurrency, rates)}
                </span>
              </div>

              {/* Remove */}
              <button
                onClick={() => removeItem(item.product.id)}
                className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500"
              >
                <Trash2 className="h-4 w-4" />
              </button>
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
                <div className="space-y-3">
                  {deliveryFields.map((field, idx) => {
                    const key = field.id || String(idx);
                    const hasError = missingKeys.includes(key);
                    const inputClass = `w-full rounded-xl border px-4 py-2.5 text-sm text-[#1e1b4b] placeholder:text-[#9ca3af] focus:border-[#7C3AED] focus:outline-none focus:ring-2 focus:ring-[#ddd6fe] bg-white ${hasError ? "border-red-400" : "border-[#e8e4f8]"}`;

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
                            onChange={(e) =>
                              updateDeliveryInfo(item.product.id, {
                                ...(item.deliveryInfo || {}),
                                [key]: e.target.value,
                              })
                            }
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
                            onChange={(e) =>
                              updateDeliveryInfo(item.product.id, {
                                ...(item.deliveryInfo || {}),
                                [key]: e.target.value,
                              })
                            }
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
              {formatPrice(totalPrice(), "USD", userCurrency, rates)}
            </span>
          </div>
        )}
        {appliedDiscount && (
          <div className="flex items-center justify-between text-sm text-green-600" dir="rtl">
            <span>خصم ({appliedDiscount.code})</span>
            <span style={{ fontFeatureSettings: '"tnum"' }}>
              −{formatPrice(appliedDiscount.amount, "USD", userCurrency, rates)}
            </span>
          </div>
        )}
        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-brand-800">{t("total")}</span>
          <span className="text-2xl font-extrabold text-brand-600" style={{ fontFeatureSettings: '"tnum"' }}>
            {formatPrice(totalAfterDiscount(), "USD", userCurrency, rates)}
          </span>
        </div>
        {!canCheckout && (
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
