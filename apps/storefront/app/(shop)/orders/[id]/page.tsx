import { notFound, redirect } from "next/navigation";
import Link from "@/components/ui/link";
import { ArrowRight, Star, Clock } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrder, getOrderEvidence, getOrderReviewsByProduct } from "@/lib/payload";
import { UsageConfirmButton } from "@/components/evidence/UsageConfirmButton";
import { ConfirmOrderButton } from "@/components/orders/ConfirmOrderButton";
import { RateProductButton } from "@/components/orders/RateProductButton";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from "@/lib/utils";

export const metadata = { title: "تفاصيل الطلب" };

// Session-scoped page -- must not be served from any cache. Without
// this, signing out and signing in as a different account (same
// browser) shows the previous user's order until a hard refresh
// because Next's Router Cache replays the prior RSC payload for the
// same URL. See app/(shop)/orders/page.tsx for the paired change.
export const dynamic = "force-dynamic";
export const revalidate = 0;

/** Compact stars row shared with the orders list rating column. */
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

/** ISO date of when the 7-day auto-confirm sweep will flip this order
 *  to delivered. Returns null when we can't parse the created_at. */
function autoConfirmAt(createdAt: string | undefined): Date | null {
  if (!createdAt) return null;
  const t = new Date(createdAt).getTime();
  if (!Number.isFinite(t)) return null;
  return new Date(t + 7 * 24 * 60 * 60 * 1000);
}

/** "بعد ٣ أيام" / "بعد ٥ ساعات" style short countdown to the given
 *  date, from now. Uses Arabic locale so the numerals match the rest
 *  of the storefront. */
function timeUntil(target: Date): string {
  const diffMs = target.getTime() - Date.now();
  if (diffMs <= 0) return "قريباً جداً";
  const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
  const hours = Math.floor((diffMs % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  if (days > 0) return `خلال ${days} يوم`;
  if (hours > 0) return `خلال ${hours} ساعة`;
  return "خلال أقل من ساعة";
}

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [order, evidence, reviewsByProduct] = await Promise.all([
    getOrder(params.id).catch(() => null),
    getOrderEvidence(params.id).catch(() => []),
    getOrderReviewsByProduct(params.id, session.user.email!).catch(() => new Map()),
  ]);
  if (!order) notFound();

  const usageConfirmed = (evidence as any[]).some((e: any) => e.type === "usage_confirmation");
  const autoAt = autoConfirmAt((order as any).createdAt);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Back link — RTL: arrow points right (natural "back" in RTL). */}
      <Link
        href="/orders"
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-600 hover:text-brand-800"
      >
        <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
        <span>العودة إلى طلباتي</span>
      </Link>

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-black text-brand-800">طلب #{order.orderNumber}</h1>
        <span className={`rounded-full px-4 py-1.5 text-sm font-bold ${getOrderStatusColor(order.status)}`}>
          {getOrderStatusLabel(order.status)}
        </span>
      </div>

      {/* Items */}
      <div className="brand-card">
        <h2 className="mb-4 text-lg font-bold text-brand-800">المنتجات</h2>
        <div className="space-y-3">
          {order.items?.map((item: any, i: number) => {
            const productId = Number(item.product?.id ?? item.product);
            const review = Number.isFinite(productId) ? (reviewsByProduct as any).get(productId) : null;
            const delivered = order.status === "delivered";
            // Two names here on purpose: `displayName` has the Arabic
            // "منتج" fallback so the item title row is never blank, but
            // `ratingName` stays undefined when no real name exists so
            // RateProductButton's subtitle line hides itself instead
            // of showing the meaningless placeholder in the modal.
            const rawName = item.product?.name?.ar || item.product?.nameAr;
            const displayName = rawName || "منتج";
            const ratingName  = rawName || undefined;
            return (
              <div key={i} className="flex flex-col gap-2 rounded-xl bg-brand-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-800">{displayName}</p>
                  <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                  {review && (
                    <div className="mt-2 flex items-center gap-2">
                      <StarsRow rating={review.rating} />
                      {review.source === "auto" ? (
                        <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700">
                          تلقائي بعد 7 أيام
                        </span>
                      ) : (
                        <span className="rounded-full bg-green-50 px-2 py-0.5 text-[10px] font-bold text-green-700">
                          تقييمك
                        </span>
                      )}
                    </div>
                  )}
                  {review?.comment && (
                    <p className="mt-1 text-xs text-gray-600">"{review.comment}"</p>
                  )}
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-600">
                    {formatPrice(item.totalPrice, order.currency)}
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
                    <span className="text-xs text-gray-400">بانتظار التقييم</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-4 flex items-center justify-between border-t border-brand-100 pt-4">
          <span className="font-bold text-brand-800">المجموع</span>
          <span className="text-xl font-extrabold text-brand-600">
            {formatPrice(order.totalAmount, order.currency)}
          </span>
        </div>
      </div>

      {/* Manual confirm (paid → delivered). The 7-day auto-confirm sweep
          catches this automatically if the customer never clicks. */}
      {order.status === "paid" && (
        <div className="brand-card border-r-4 border-brand-500">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="mb-1 text-lg font-bold text-brand-800">تأكيد الطلب</h2>
              <p className="text-sm text-gray-500">
                إذا استلمت المنتج، يمكنك تأكيد الطلب الآن. سيتم التأكيد تلقائياً بعد 7 أيام إذا لم تقم بذلك.
              </p>
              {autoAt && (
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs font-bold text-brand-700">
                  <Clock className="h-3.5 w-3.5" strokeWidth={2.5} />
                  <span>التأكيد التلقائي {timeUntil(autoAt)}</span>
                </p>
              )}
            </div>
            <ConfirmOrderButton orderId={order.id} />
          </div>
        </div>
      )}

      {/* Digital Delivery */}
      {order.status === "delivered" && order.digitalDeliveryLog && (
        <div className="brand-card border-r-4 border-green-500">
          <h2 className="mb-3 text-lg font-bold text-green-800">تفاصيل التسليم</h2>
          <pre className="rounded-xl bg-green-50 p-4 text-sm text-green-700 whitespace-pre-wrap">
            {typeof order.digitalDeliveryLog === "string"
              ? order.digitalDeliveryLog
              : JSON.stringify(order.digitalDeliveryLog, null, 2)}
          </pre>
        </div>
      )}

      {/* Usage Confirmation */}
      {(order.status === "delivered" || order.status === "paid") && (
        <div className="brand-card">
          <h2 className="mb-4 text-lg font-bold text-brand-800">تأكيد الاستلام</h2>
          <UsageConfirmButton
            orderId={order.id}
            customerId={session.user.id!}
            productId={order.items?.[0]?.product?.id || ""}
            alreadyConfirmed={usageConfirmed}
          />
        </div>
      )}
    </div>
  );
}
