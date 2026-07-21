import dynamicImport from "next/dynamic";

export const dynamic = "force-dynamic";
export const metadata = { title: "إتمام الشراء | Checkout" };

const CheckoutForm = dynamicImport(
  () =>
    import("@/components/checkout/CheckoutForm").then((m) => ({
      default: m.CheckoutForm,
    })),
  { ssr: false }
);

/**
 * Server shell for the checkout. The visible page heading used to
 * live here as a hardcoded Arabic string; moved into CheckoutForm so
 * it can flip with the visitor's locale-store setting (server can't
 * read localStorage).
 */
export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <CheckoutForm />
    </div>
  );
}
