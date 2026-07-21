import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { getOrder, getOrderEvidence, getOrderReviewsByProduct } from "@/lib/payload";
import { OrderDetailView } from "./OrderDetailView";

export const metadata = { title: "تفاصيل الطلب | Order details" };

// Session-scoped page -- must not be served from any cache. Without
// this, signing out and signing in as a different account (same
// browser) shows the previous user's order until a hard refresh
// because Next's Router Cache replays the prior RSC payload for the
// same URL. See app/(shop)/orders/page.tsx for the paired change.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [order, evidence, reviewsByProduct] = await Promise.all([
    getOrder(params.id).catch(() => null),
    getOrderEvidence(params.id).catch(() => []),
    getOrderReviewsByProduct(params.id, session.user.email!).catch(() => new Map()),
  ]);
  if (!order) notFound();

  // Serialize the Map for the client component (Maps don't cross the
  // RSC boundary as-is; a plain object works).
  const reviewsObj: Record<string, any> = {};
  for (const [k, v] of reviewsByProduct as any as Map<number, any>) {
    reviewsObj[String(k)] = v;
  }
  const reviewsMap = new Map<number, any>(
    Object.entries(reviewsObj).map(([k, v]) => [Number(k), v]),
  );

  return (
    <OrderDetailView
      order={order}
      evidence={evidence as any[]}
      reviewsByProduct={reviewsMap}
      sessionEmail={session.user.email!}
      sessionUserId={session.user.id!}
    />
  );
}
