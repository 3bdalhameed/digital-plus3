import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product, CartItem, CartState } from "@my-store/types";

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (product: Product, deliveryInfo?: Record<string, string>) => {
        const items = get().items;
        const existing = items.find((i) => i.product.id === product.id);

        if (existing) {
          set({
            items: items.map((i) =>
              i.product.id === product.id
                ? { ...i, quantity: i.quantity + 1, deliveryInfo: deliveryInfo ?? i.deliveryInfo }
                : i
            ),
          });
        } else {
          set({ items: [...items, { product, quantity: 1, deliveryInfo }] });
        }
      },

      removeItem: (productId: string) => {
        set({ items: get().items.filter((i) => i.product.id !== productId) });
      },

      updateDeliveryInfo: (productId: string, deliveryInfo: Record<string, string>) => {
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, deliveryInfo } : i
          ),
        });
      },

      updateQuantity: (productId: string, quantity: number) => {
        if (quantity <= 0) {
          get().removeItem(productId);
          return;
        }
        set({
          items: get().items.map((i) =>
            i.product.id === productId ? { ...i, quantity } : i
          ),
        });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () =>
        get().items.reduce((sum, item) => sum + item.quantity, 0),

      totalPrice: () =>
        get().items.reduce(
          (sum, item) => sum + item.product.price * item.quantity,
          0
        ),
    }),
    {
      name: "cart-storage",
    }
  )
);
