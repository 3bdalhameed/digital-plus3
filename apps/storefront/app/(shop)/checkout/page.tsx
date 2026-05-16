import { CheckoutForm } from "@/components/checkout/CheckoutForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "إتمام الشراء" };

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">إتمام الشراء</h1>
      <CheckoutForm />
    </div>
  );
}
