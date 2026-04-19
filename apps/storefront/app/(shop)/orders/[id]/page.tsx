import { notFound, redirect } from "next/navigation";
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
          {order.items?.map((item: any, i: number) => (
            <div key={i} className="flex items-center justify-between rounded-xl bg-brand-50 p-3">
              <div>
                <p className="text-sm font-bold text-brand-800">
                  {item.product?.name?.ar || item.product?.nameAr || "منتج"}
                </p>
                <p className="text-xs text-gray-500">الكمية: {item.quantity}</p>
              </div>
              <span className="text-sm font-bold text-brand-600">
                {formatPrice(item.totalPrice, order.currency)}
              </span>
            </div>
          ))}
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
