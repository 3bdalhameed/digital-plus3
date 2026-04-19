import { auth } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/payload";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrderStatusLabel, getOrderStatusColor, formatPrice, getRelativeTime } from "@/lib/utils";

export const metadata = { title: "طلباتي" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getCustomerOrders(session.user.id!).catch(() => []);

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">طلباتي</h1>

      {orders.length === 0 ? (
        <div className="brand-card py-16 text-center">
          <span className="text-5xl">📋</span>
          <h2 className="mt-4 text-lg font-bold text-brand-800">لا توجد طلبات</h2>
          <Link href="/products" className="brand-btn mt-4 inline-block">تصفح المنتجات</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Link key={order.id} href={`/orders/${order.id}`} className="brand-card block transition-shadow hover:shadow-card-hover">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-brand-800">طلب #{order.orderNumber}</p>
                  <p className="mt-1 text-xs text-gray-400">{getRelativeTime(order.createdAt)}</p>
                </div>
                <div className="text-left">
                  <span className={`inline-block rounded-full px-3 py-1 text-xs font-bold ${getOrderStatusColor(order.status)}`}>
                    {getOrderStatusLabel(order.status)}
                  </span>
                  <p className="mt-1 text-sm font-bold text-brand-600">
                    {formatPrice(order.totalAmount, order.currency)}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
