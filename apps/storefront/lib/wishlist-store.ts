import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Product } from "@my-store/types";

/**
 * Wishlist (المفضلة) state — list of products the user has hearted.
 * Persisted to localStorage like the cart so it survives a refresh.
 * No server sync (yet) — purely client-side until we have an authed user
 * account that needs cross-device wishlists.
 */
export interface WishlistState {
  items: Product[];
  hasItem: (productId: string | number) => boolean;
  toggle: (product: Product) => void;
  add: (product: Product) => void;
  remove: (productId: string | number) => void;
  clear: () => void;
  count: () => number;
}

export const useWishlistStore = create<WishlistState>()(
  persist(
    (set, get) => ({
      items: [],

      hasItem: (productId) => {
        const idStr = String(productId);
        return get().items.some((p) => String(p.id) === idStr);
      },

      toggle: (product) => {
        const idStr = String(product.id);
        const exists = get().items.some((p) => String(p.id) === idStr);
        set({
          items: exists
            ? get().items.filter((p) => String(p.id) !== idStr)
            : [product, ...get().items],
        });
      },

      add: (product) => {
        const idStr = String(product.id);
        if (get().items.some((p) => String(p.id) === idStr)) return;
        set({ items: [product, ...get().items] });
      },

      remove: (productId) => {
        const idStr = String(productId);
        set({ items: get().items.filter((p) => String(p.id) !== idStr) });
      },

      clear: () => set({ items: [] }),

      count: () => get().items.length,
    }),
    { name: "dp-wishlist-v1" }
  )
);
