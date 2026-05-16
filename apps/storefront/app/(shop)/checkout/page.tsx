import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const metadata = { title: "إتمام الشراء" };

const CheckoutForm = dynamicImport(
  () =>
    import("@/components/checkout/CheckoutForm").then((m) => ({
      default: m.CheckoutForm,
    })),
  { ssr: false }
);

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">إتمام الشراء</h1>
      <CheckoutForm />
    </div>
  );
}
