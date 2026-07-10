import Link from "@/components/ui/link";
import { CheckCircle } from "lucide-react";

export const metadata = { title: "تم الطلب بنجاح" };

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string };
}) {
  return (
    <div className="mx-auto max-w-lg py-16 text-center">
      <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100">
        <CheckCircle className="h-10 w-10 text-green-600" />
      </div>
      <h1 className="text-2xl font-black text-brand-800">تم الطلب بنجاح!</h1>
      <p className="mt-4 text-gray-500">
        شكراً لك! تم استلام طلبك وسيتم تسليم المنتجات الرقمية قريباً.
        ستصلك رسالة بريد إلكتروني بتفاصيل الطلب.
      </p>
      {searchParams.orderId && (
        <p className="mt-2 text-sm font-medium text-brand-600">
          رقم الطلب: {searchParams.orderId}
        </p>
      )}
      <div className="mt-8 flex justify-center gap-3">
        {searchParams.orderId && (
          <Link
            href={`/orders/${searchParams.orderId}`}
            className="brand-btn"
          >
            عرض الطلب
          </Link>
        )}
        <Link href="/products" className="brand-btn-outline">
          تصفح المنتجات
        </Link>
      </div>
    </div>
  );
}
