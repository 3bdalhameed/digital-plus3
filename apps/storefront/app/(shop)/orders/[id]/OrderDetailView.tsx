"use client";

import Link from "@/components/ui/link";
import { ArrowRight, Star, Clock } from "lucide-react";
import { UsageConfirmButton } from "@/components/evidence/UsageConfirmButton";
import { RateProductButton } from "@/components/orders/RateProductButton";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from "@/lib/utils";
import { useT } from "@/lib/i18n";
import { useLocaleStore } from "@/lib/locale-store";

/**
 * Client wrapper for the order-detail page. The parent server
 * component fetches all data + auth-gates; this component reads the
 * visitor's language from useLocaleStore and localizes every visible
 * string so switching the locale modal to English actually flips the
 * page. The server can't read the client-persisted locale, so all
 * user-facing copy lives here.
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

function autoConfirmAt(createdAt: string | undefined): Date | null {
  if (!createdAt) return null;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + 7 * 24 * 60 * 60 * 1000);
}

function timeUntil(target: Date, isEn: boolean): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return isEn ? "very soon" : "قريباً جداً";
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0)  return isEn ? `in ${days} day${days === 1 ? "" : "s"}`   : `خلال ${days} يوم`;
  if (hours > 0) return isEn ? `in ${hours} hour${hours === 1 ? "" : "s"}` : `خلال ${hours} ساعة`;
  return isEn ? "in less than an hour" : "خلال أقل من ساعة";
}

export function OrderDetailView({
  order,
  evidence,
  reviewsByProduct,
  sessionEmail,
  sessionUserId,
}: {
  order: any;
  evidence: any[];
  reviewsByProduct: Map<number, any>;
  sessionEmail: string;
  sessionUserId: string;
}) {
  const { isEn } = useT();
  const { lang } = useLocaleStore();

  const usageConfirmed = evidence.some((e) => e.type === "usage_confirmation");
  const autoAt = autoConfirmAt(order.createdAt);

  const L = {
    backToOrders:  isEn ? "Back to my orders" : "العودة إلى طلباتي",
    orderPrefix:   isEn ? "Order"             : "طلب",
    productsTitle: isEn ? "Products"          : "المنتجات",
    quantity:      isEn ? "Quantity"          : "الكمية",
    autoBadge:     isEn ? "Auto after 7 days" : "تلقائي بعد 7 أيام",
    yourReview:    isEn ? "Your review"       : "تقييمك",
    waitingReview: isEn ? "Awaiting review"   : "بانتظار التقييم",
    total:         isEn ? "Total"             : "المجموع",
    confirmTitle:  isEn ? "Confirm order"     : "تأكيد الطلب",
    confirmBody:   isEn ? "If you received the product, you can confirm the order now. Auto-confirm happens after 7 days if you don't." : "إذا استلمت المنتج، يمكنك تأكيد الطلب الآن. سيتم التأكيد تلقائياً بعد 7 أيام إذا لم تقم بذلك.",
    autoConfirmIn: isEn ? "Auto-confirm"      : "التأكيد التلقائي",
    deliveryTitle: isEn ? "Delivery details"  : "تفاصيل التسليم",
    receiptTitle:  isEn ? "Confirm receipt"   : "تأكيد الاستلام",
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        <span>{L.backToOrders}</span>
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-brand-800">{L.orderPrefix} #{order.orderNumber}</h1>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${getOrderStatusColor(order.status)}`}>
          {getOrderStatusLabel(order.status, isEn)}
        </span>
      </div>

      {/* Items */}
      <div className="brand-card">
        <h2 className="mb-4 text-lg font-bold text-brand-800">{L.productsTitle}</h2>
        <div className="space-y-3">
          {order.items?.map((item: any, i: number) => {
            const productId = Number(item.product?.id ?? item.product);
            const review = Number.isFinite(productId) ? reviewsByProduct.get(productId) : null;
            const delivered = order.status === "delivered";
            const nameAr = item.product?.name?.ar || item.product?.nameAr;
            const nameEn = item.product?.name?.en || item.product?.nameEn;
            const displayName = (isEn ? (nameEn || nameAr) : (nameAr || nameEn)) || (isEn ? "Product" : "منتج");
            const ratingName  = (isEn ? (nameEn || nameAr) : (nameAr || nameEn)) || undefined;
            return (
              <div key={i} className="flex flex-col gap-2 rounded-xl bg-brand-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-800">{displayName}</p>
                  <p className="text-xs text-gray-500">{L.quantity}: {item.quantity}</p>
                  {review && (
                    <div className="mt-2 flex items-center gap-2">
                      <StarsRow rating={review.rating} />
                      {review.source === "auto" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          {L.autoBadge}
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          {L.yourReview}
                        </span>
                      )}
                    </div>
                  )}
                  {review?.comment && (
                    <p className="mt-1 text-xs text-gray-600">&ldquo;{review.comment}&rdquo;</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-600">
                    {formatPrice(item.totalPrice, order.currency, undefined, undefined, lang)}
                  </span>
                  {delivered && !review && Number.isFinite(productId) && (
                    <RateProductButton
                      orderId={order.id}
                      productId={productId}
                      productName={ratingName}
                      size="md"
                    />
                  )}
                  {delivered && !review && !Number.isFinite(productId) && (
                    <span className="text-xs text-gray-400">{L.waitingReview}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-4">
          <span className="font-bold text-brand-800">{L.total}</span>
          <span className="text-xl font-extrabold text-brand-600">
            {formatPrice(order.totalAmount, order.currency, undefined, undefined, lang)}
          </span>
        </div>
      </div>

      {order.status === "delivered" && order.digitalDeliveryLog && (
        <div className="brand-card border-r-4 border-green-500">
          <h2 className="mb-3 text-lg font-bold text-green-800">{L.deliveryTitle}</h2>
          <pre className="rounded-xl bg-green-50 p-4 text-sm text-green-700 whitespace-pre-wrap">
            {typeof order.digitalDeliveryLog === "string"
              ? order.digitalDeliveryLog
              : JSON.stringify(order.digitalDeliveryLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Single confirm block. The old "confirm order" (paid→delivered)
          and "confirm receipt & use" were two separate buttons that
          confused customers. Merged into one: the button both flips the
          order to delivered (when still paid) AND logs the usage
          confirmation. The auto-confirm hint only shows while the order
          is still paid. */}
      {(order.status === "delivered" || order.status === "paid") && (
        <div className="brand-card border-r-4 border-brand-500">
          <h2 className="mb-1 text-lg font-bold text-brand-800">{L.confirmTitle}</h2>
          {order.status === "paid" && (
            <>
              <p className="text-sm text-gray-500">{L.confirmBody}</p>
              {autoAt && (
                <p className="mt-2 mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>{L.autoConfirmIn} {timeUntil(autoAt, isEn)}</span>
                </p>
              )}
            </>
          )}
          <div className={order.status === "paid" ? "" : "mt-1"}>
            <UsageConfirmButton
              orderId={order.id}
              customerId={sessionUserId}
              productId={order.items?.[0]?.product?.id || ""}
              alreadyConfirmed={usageConfirmed}
              confirmOrder={order.status === "paid"}
            />
          </div>
        </div>
      )}
    </div>
  );
}
