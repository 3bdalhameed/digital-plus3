import { auth } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/payload";
import { redirect } from "next/navigation";
import { OrdersView } from "./OrdersView";

export const metadata = { title: "طلباتي | My Orders" };

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getCustomerOrders(session.user.email!).catch(() => []);

  return <OrdersView orders={orders} />;
}
