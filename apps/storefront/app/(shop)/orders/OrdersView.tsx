"use client";

import Link from "@/components/ui/link";
import { useState } from "react";
import { Star, ChevronDown, Package } from "lucide-react";
import { RateProductButton } from "@/components/orders/RateProductButton";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/**
 * Simplified orders list — one compact row per order with a summary
 * pill, click-to-expand for items + rating actions. Previously each
 * row had 3-4 stacked status blocks (paid vs delivered vs auto-
 * confirmed vs rating summary) that were confusing to skim through
 * for anyone with more than a couple of orders.
 */

function StarsRow({ rating }: { rating: number }) {
  return (
    <span className="inline-flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          strokeWidth={2}
        />
      ))}
    </span>
  );
}

function formatDate(iso: string, locale: string) {
  try {
    return new Date(iso).toLocaleDateString(locale, {
      day: "numeric", month: "short", year: "numeric",
    });
  } catch { return ""; }
}

export function OrdersView({ orders }: { orders: any[] }) {
  const { t, dir, isEn, lang } = useT();
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggle = (id: string) =>
    setExpanded((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const M = {
    heading:      t("ordersTitle"),
    empty:        isEn ? "No orders yet"                                  : "لا توجد طلبات",
    emptyHint:    isEn ? "Your purchases will appear here once you place your first order." : "ستظهر مشترياتك هنا بعد إتمام أول طلب.",
    orderPrefix:  isEn ? "Order"                                          : "طلب",
    itemsCount:   (n: number) => isEn
      ? `${n} ${n === 1 ? "item" : "items"}`
      : `${n} ${n === 1 ? "منتج" : "منتجات"}`,
    ratingProgress: (r: number, t: number) => isEn
      ? `${r}/${t} rated`
      : `${r}/${t} مقيّم`,
    hideDetails:  isEn ? "Hide details"                                    : "إخفاء التفاصيل",
    showDetails:  isEn ? "Show details"                                    : "عرض التفاصيل",
    notRated:     isEn ? "Not rated"                                       : "بلا تقييم",
    autoRating:   isEn ? "Auto"                                            : "تلقائي",
  };

  const dateLocale = isEn ? "en-US" : "ar-EG-u-nu-latn";

  if (orders.length === 0) {
    return (
      <div className="mx-auto max-w-3xl" dir={dir}>
        <h1 className="mb-8 text-2xl font-black text-brand-800">{M.heading}</h1>
        <div className="brand-card flex flex-col items-center gap-3 px-6 py-16 text-center">
          <span className="flex h-16 w-16 items-center justify-center rounded-full bg-brand-50 text-3xl">
            <Package className="h-8 w-8 text-brand-500" />
          </span>
          <h2 className="text-lg font-bold text-brand-800">{M.empty}</h2>
          <p className="max-w-sm text-sm text-gray-500">{M.emptyHint}</p>
          <Link href="/products" className="brand-btn mt-3">
            {t("browseProducts")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl" dir={dir}>
      <h1 className="mb-6 text-2xl font-black text-brand-800">{M.heading}</h1>

      <div className="space-y-3">
        {orders.map((order) => {
          const isOpen = expanded.has(String(order.id));
          const totalItems  = order.items.length;
          const ratedItems  = order.items.filter((i: any) => i.reviewRating != null).length;
          const canRate     = order.status === "delivered";

          return (
            <div key={order.id} className="brand-card overflow-hidden p-0">
              {/* Summary row — always visible. Click to expand. */}
              <button
                type="button"
                onClick={() => toggle(String(order.id))}
                className="flex w-full items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-brand-50/60"
              >
                {/* Left: order number + date */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-brand-800">
                    {M.orderPrefix} #{order.orderNumber}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {formatDate(order.createdAt, dateLocale)} · {M.itemsCount(totalItems)}
                  </p>
                </div>

                {/* Middle: status pill */}
                <span
                  className={`hidden shrink-0 rounded-full px-3 py-1 text-[11px] font-bold sm:inline-block ${getOrderStatusColor(order.status)}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>

                {/* Right: total + chevron */}
                <div className="flex shrink-0 items-center gap-3">
                  <span className="text-sm font-bold text-brand-600" style={{ fontFeatureSettings: '"tnum"' }}>
                    {formatPrice(order.totalAmount, order.currency, undefined, undefined, lang)}
                  </span>
                  <ChevronDown
                    className={`h-4 w-4 text-gray-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </div>
              </button>

              {/* Mobile: status pill under summary row so it's visible without expand */}
              <div className="border-t border-brand-50 px-4 py-2 sm:hidden">
                <span
                  className={`inline-block rounded-full px-3 py-1 text-[11px] font-bold ${getOrderStatusColor(order.status)}`}
                >
                  {getOrderStatusLabel(order.status)}
                </span>
                {canRate && (
                  <span className="ms-2 text-[11px] text-gray-500">
                    {M.ratingProgress(ratedItems, totalItems)}
                  </span>
                )}
              </div>

              {/* Expanded — items list + rating actions */}
              {isOpen && (
                <div className="border-t border-brand-100 bg-brand-50/40 px-4 py-3">
                  {canRate && (
                    <p className="mb-2 hidden text-xs text-gray-500 sm:block">
                      {M.ratingProgress(ratedItems, totalItems)}
                    </p>
                  )}
                  <ul className="divide-y divide-brand-100">
                    {order.items.map((item: any, idx: number) => (
                      <li key={`${order.id}-${idx}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="line-clamp-1 flex-1 font-medium text-brand-800">
                          {item.productName}
                        </span>
                        {canRate && item.reviewRating != null ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <StarsRow rating={item.reviewRating} />
                            {item.reviewSource === "auto" && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {M.autoRating}
                              </span>
                            )}
                          </span>
                        ) : canRate && item.productId ? (
                          <RateProductButton
                            orderId={order.id}
                            productId={item.productId}
                            productName={item.productName}
                            size="sm"
                          />
                        ) : canRate ? (
                          <span className="shrink-0 text-xs text-gray-400">{M.notRated}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-3 flex justify-end">
                    <Link
                      href={`/orders/${order.id}`}
                      className="text-xs font-bold text-brand-500 hover:underline"
                    >
                      {isEn ? "Full details →" : "التفاصيل الكاملة ←"}
                    </Link>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
