import { SuccessContent } from "./SuccessContent";

export const metadata = { title: "تم الطلب بنجاح | Order placed" };

export default function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { orderId?: string; pending?: string };
}) {
  return (
    <SuccessContent
      orderId={searchParams.orderId}
      pending={searchParams.pending === "1"}
    />
  );
}
