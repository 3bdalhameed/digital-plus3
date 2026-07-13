import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem, CartState, AppliedDiscount } from "@my-store/types";

// Debounced server sync so we don't hit the API on every keystroke
let syncTimer: ReturnType<typeof setTimeout> | null = null;

function syncCartToServer(items: CartItem[], action: "update" | "complete" = "update") {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    fetch("/api/cart/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: items.map((i) => ({
          productId: i.product.id,
          name: (i.product as any).nameAr ?? i.product.name?.ar ?? "",
          quantity: i.quantity,
          price: i.product.price,
          currency: i.product.currency,
        })),
        action,
      }),
    }).catch(() => {}); // fire and forget — never block the UI
  }, 1500); // 1.5s debounce
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      appliedDiscount: null,

      addItem: (product: Product, deliveryInfo?: Record<string, string>) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);
        let next: CartItem[];

        if (existing) {
          next = items.map((i) =>
            i.product.id === product.id
              ? { ...i, quantity: i.quantity + 1, deliveryInfo: deliveryInfo ?? i.deliveryInfo }
              : i
          );
        } else {
          next = [...items, { product, quantity: 1, deliveryInfo }];
        }

        set({ items: next });
        syncCartToServer(next);
      },

      removeItem: (productId: string) => {
        const next = get().items.filter((i) => i.product.id !== productId);
        set({ items: next });
        syncCartToServer(next);
      },

      updateDeliveryInfo: (productId: string, deliveryInfo: Record<string, string>) => {
        const next = get().items.map((i) =>
          i.product.id === productId ? { ...i, deliveryInfo } : i
        );
        set({ items: next });
        // No sync needed for delivery info changes — only product changes matter
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        const next = get().items.map((i) =>
          i.product.id === productId ? { ...i, quantity } : i
        );
        set({ items: next });
        syncCartToServer(next);
      },

      clearCart: () => {
        // Clearing the cart also drops any applied discount -- an empty
        // cart can't carry a code, and re-applying against a fresh cart
        // avoids a stale amount that was calculated against old items.
        set({ items: [], appliedDiscount: null });
        syncCartToServer([], "complete");
      },

      applyDiscount: (d: AppliedDiscount) => set({ appliedDiscount: d }),
      clearDiscount: () => set({ appliedDiscount: null }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),

      totalAfterDiscount: () => {
        const total = get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        );
        const d = get().appliedDiscount;
        if (!d) return total;
        // Guard against a stored discount that's larger than the current
        // cart (items removed after applying) -- never go below 0.
        return Math.max(0, total - d.amount);
      },
    }),
    {
      name: "cart-storage",
    }
  )
);
