"use client";

import Link from "@/components/ui/link";
import { CheckCircle } from "lucide-react";
import { useT } from "@/lib/i18n";

export function SuccessContent({
  orderId,
  pending,
}: {
  orderId?: string;
  pending: boolean;
}) {
  const { t, dir, isEn } = useT();

  const heading = pending
    ? t("orderPending")
    : (isEn ? "Order placed successfully!" : "تم الطلب بنجاح!");
  const body = pending
    ? t("orderPendingHint")
    : isEn
      ? "Thank you! We received your order and will deliver the digital products shortly. You'll receive an email with the order details."
      : "شكراً لك! تم استلام طلبك وسيتم تسليم المنتجات الرقمية قريباً. ستصلك رسالة بريد إلكتروني بتفاصيل الطلب.";
  const viewOrder = isEn ? "View order" : "عرض الطلب";

  return (
    <div className="mx-auto max-w-lg py-16 text-center" dir={dir}>
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-black text-brand-800">{heading}</h1>
      <p className="mt-4 text-gray-500">{body}</p>
      {orderId && (
        <p className="mt-2 text-sm font-medium text-brand-600">
          {t("orderNumberLabel")}: {orderId}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        {orderId && (
          <Link href={`/orders/${orderId}`} className="brand-btn">
            {viewOrder}
          </Link>
        )}
        <Link href="/products" className="brand-btn-outline">
          {t("browseProducts")}
        </Link>
      </div>
    </div>
  );
}
