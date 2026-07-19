import { auth } from "@/lib/auth";
import { getCustomerOrders } from "@/lib/payload";
import { redirect } from "next/navigation";
import { OrdersView } from "./OrdersView";

export const metadata = { title: "طلباتي | My Orders" };

// Session-scoped data -- must not be served from Next's Data Cache or
// baked into a static prerender. `force-dynamic` runs the page on every
// request; `revalidate = 0` opts out of Route Cache entirely so a stale
// user A response can't be replayed after user B signs in. The client
// Router Cache is handled separately -- see the router.refresh() call
// in Header.tsx's signOut handler.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const orders = await getCustomerOrders(session.user.email!).catch(() => []);

  return <OrdersView orders={orders} />;
}
