import { CartItems } from "@/components/cart/CartItems";

export const metadata = { title: "سلة التسوق" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-8 text-2xl font-black text-brand-800">سلة التسوق</h1>
      <CartItems />
    </div>
  );
}
