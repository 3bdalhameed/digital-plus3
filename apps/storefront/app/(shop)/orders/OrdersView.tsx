"use client";

import Link from "@/components/ui/link";
import { Star, Clock, CheckCircle2, Package } from "lucide-react";
import { RateProductButton } from "@/components/orders/RateProductButton";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice, getRelativeTime } from "@/lib/utils";
import { useT } from "@/lib/i18n";

/** Small stars row used inline in each order card. */
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

export function OrdersView({ orders }: { orders: any[] }) {
  const { t, dir, isEn } = useT();

  const M = {
    heading:        t("ordersTitle"),
    empty:          isEn ? "No orders yet" : "لا توجد طلبات",
    orderPrefix:    isEn ? "Order #" : "طلب #",
    awaitingConfirm:       isEn ? "Awaiting delivery confirmation"          : "بانتظار تأكيد الاستلام",
    autoConfirmHint:       isEn ? "Will be auto-confirmed after 7 days if you don't confirm manually." : "سيتم التأكيد تلقائياً بعد 7 أيام إذا لم تقم بذلك يدوياً.",
    confirmedByCustomer:   isEn ? "You confirmed delivery"                  : "تم تأكيد الاستلام",
    confirmedAuto:         isEn ? "Auto-confirmed after 7 days"             : "تم التأكيد تلقائياً بعد 7 أيام",
    confirmedByAdmin:      isEn ? "Confirmed by the store"                  : "تم التأكيد من قبل المتجر",
    delivered:             isEn ? "Delivered"                               : "تم التسليم",
    allRated:  (r: number, tot: number) => isEn ? `You rated all products (${r}/${tot})`   : `قيّمت جميع المنتجات (${r}/${tot})`,
    pendingRatings: (tot: number) => isEn ? `Awaiting your rating (${tot} items)`    : `بانتظار التقييم (${tot} منتج)`,
    partialRated:  (r: number, tot: number) => isEn ? `You rated ${r} of ${tot}`                : `قيّمت ${r} من أصل ${tot}`,
    autoRating:            isEn ? "Auto"        : "تلقائي",
    awaitingRating:        isEn ? "Not rated"   : "بانتظار التقييم",
  };

  return (
    <div className="mx-auto max-w-3xl" dir={dir}>
      <h1 className="mb-8 text-2xl font-black text-brand-800">{M.heading}</h1>

      {orders.length === 0 ? (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📋</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">{M.empty}</h2>
          <Link href="/products" className="brand-btn mt-4 inline-block">
            {t("browseProducts")}
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isPaid      = order.status === "paid";
            const isDelivered = order.status === "delivered";
            const totalItems  = order.items.length;
            const ratedItems  = order.items.filter((i: any) => i.reviewRating != null).length;

            return (
              <div key={order.id} className="brand-card block">
                <Link
                  href={`/orders/${order.id}`}
                  className="flex items-start justify-between gap-3 transition-colors hover:text-brand-700"
                >
                  <div>
                    <p className="text-sm font-bold text-brand-800">
                      {M.orderPrefix}{order.orderNumber}
                    </p>
                    <p className="mt-1 text-xs text-gray-400">
                      {getRelativeTime(order.createdAt)}
                    </p>
                  </div>
                  <div className="text-left">
                    <span
                      className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusColor(order.status)}`}
                    >
                      {getOrderStatusLabel(order.status)}
                    </span>
                    <p className="mt-1 text-sm font-bold text-brand-600">
                      {formatPrice(order.totalAmount, order.currency)}
                    </p>
                  </div>
                </Link>

                {isPaid && (
                  <div className="mt-4 flex items-start gap-2 rounded-xl border border-brand-100 bg-brand-50 p-3">
                    <Clock className="mt-0.5 h-4 w-4 shrink-0 text-brand-500" />
                    <div className="flex-1">
                      <p className="text-xs font-bold text-brand-800">{M.awaitingConfirm}</p>
                      <p className="mt-0.5 text-xs text-gray-500">{M.autoConfirmHint}</p>
                    </div>
                  </div>
                )}

                {isDelivered && totalItems > 0 && (() => {
                  const cfg =
                    order.confirmedBy === "customer"
                      ? { title: M.confirmedByCustomer, border: "border-green-100", bg: "bg-green-50", titleClr: "text-green-800", subClr: "text-green-700", icon: "text-green-600" }
                      : order.confirmedBy === "auto"
                      ? { title: M.confirmedAuto,       border: "border-amber-100", bg: "bg-amber-50", titleClr: "text-amber-800", subClr: "text-amber-700", icon: "text-amber-600" }
                      : order.confirmedBy === "admin"
                      ? { title: M.confirmedByAdmin,    border: "border-brand-100", bg: "bg-brand-50", titleClr: "text-brand-800", subClr: "text-brand-700", icon: "text-brand-600" }
                      : { title: M.delivered,           border: "border-green-100", bg: "bg-green-50", titleClr: "text-green-800", subClr: "text-green-700", icon: "text-green-600" };
                  return (
                    <div className={`mt-4 flex items-start gap-2 rounded-xl border ${cfg.border} ${cfg.bg} p-3`}>
                      {order.confirmedBy === "auto" ? (
                        <Clock className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.icon}`} />
                      ) : order.confirmedBy === "admin" ? (
                        <Package className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.icon}`} />
                      ) : (
                        <CheckCircle2 className={`mt-0.5 h-4 w-4 shrink-0 ${cfg.icon}`} />
                      )}
                      <div className="flex-1">
                        <p className={`text-xs font-bold ${cfg.titleClr}`}>{cfg.title}</p>
                        <p className={`mt-0.5 text-xs ${cfg.subClr}`}>
                          {ratedItems === totalItems
                            ? M.allRated(ratedItems, totalItems)
                            : ratedItems === 0
                            ? M.pendingRatings(totalItems)
                            : M.partialRated(ratedItems, totalItems)}
                        </p>
                      </div>
                    </div>
                  );
                })()}

                {isDelivered && order.items.length > 0 && (
                  <div className="mt-3 divide-y divide-brand-50 border-t border-brand-100 pt-3">
                    {order.items.map((item: any, idx: number) => (
                      <div key={`${order.id}-${idx}`} className="flex items-center justify-between gap-3 py-2 text-sm">
                        <span className="line-clamp-1 font-medium text-brand-800">
                          {item.productName}
                        </span>
                        {item.reviewRating != null ? (
                          <span className="flex shrink-0 items-center gap-1.5">
                            <StarsRow rating={item.reviewRating} />
                            {item.reviewSource === "auto" && (
                              <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                                {M.autoRating}
                              </span>
                            )}
                          </span>
                        ) : item.productId ? (
                          <RateProductButton
                            orderId={order.id}
                            productId={item.productId}
                            productName={item.productName}
                            size="sm"
                          />
                        ) : (
                          <span className="shrink-0 text-xs text-gray-400">
                            {M.awaitingRating}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
