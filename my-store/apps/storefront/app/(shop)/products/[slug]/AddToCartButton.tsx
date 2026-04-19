"use client";

import { useState } from "react";
import { ShoppingCart, Check } from "lucide-react";
import { useCartStore } from "@/lib/store";
import type { Product } from "@my-store/types";

export function AddToCartButton({ product }: { product: Product }) {
  const addItem = useCartStore((s) => s.addItem);
  const [added, setAdded] = useState(false);

  const handleAdd = () => {
    addItem(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <button
      onClick={handleAdd}
      className={`w-full gap-2 text-base ${
        added
          ? "inline-flex items-center justify-center rounded-xl bg-green-500 px-6 py-4 font-semibold text-white"
          : "brand-btn py-4"
      }`}
    >
      {added ? (
        <>
          <Check className="h-5 w-5" />
          تمت الإضافة
        </>
      ) : (
        <>
          <ShoppingCart className="h-5 w-5" />
          أضف إلى السلة
        </>
      )}
    </button>
  );
}
