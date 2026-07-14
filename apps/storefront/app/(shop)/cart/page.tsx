import { CartItems } from "@/components/cart/CartItems";
import { CartHeader } from "./CartHeader";

export const metadata = { title: "سلة التسوق | Cart" };

export default function CartPage() {
  return (
    <div className="mx-auto max-w-3xl">
      <CartHeader />
      <CartItems />
    </div>
  );
}
