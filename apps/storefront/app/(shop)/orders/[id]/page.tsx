import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { auth } from "@/lib/auth";
import { getOrder, getOrderEvidence } from "@/lib/payload";
import { UsageConfirmButton } from "@/components/evidence/UsageConfirmButton";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice } from "@/lib/utils";

export const metadata = { title: "تفاصيل الطلب" };

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const order = await getOrder(params.id).catch(() => null);
  if (!order) notFound();

  const evidence = await getOrderEvidence(params.id).catch(() => []);
  const usageConfirmed = evidence.some((e: any) => e.type === "usage_confirmation");

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
            const slug = item.product?.slug;
            // Rate button only shown once the order is delivered and the
            // product still exists (slug is what we route to for
            // reviewing). Anchors to #reviews so the tab opens directly.
            const canRate = order.status === "delivered" && !!slug;
            return (
              <div key={i} className="flex flex-col gap-2 rounded-xl bg-brand-50 p-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-800">
                    {item.product?.name?.ar || item.product?.nameAr || "منتج"}
                  </p>
                  <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-brand-600">
                    {formatPrice(item.totalPrice, order.currency)}
                  </span>
                  {canRate && (
                    <Link
                      href={`/products/${slug}#reviews`}
                      className="inline-flex items-center gap-1 rounded-full bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm transition-all hover:bg-brand-700 active:scale-95"
                    >
                      <Star className="h-3.5 w-3.5" strokeWidth={2.5} fill="currentColor" />
                      <span>قيّم المنتج</span>
                    </Link>
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
