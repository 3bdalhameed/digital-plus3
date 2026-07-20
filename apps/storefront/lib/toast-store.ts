import { create } from "zustand";

/**
 * Tiny "cart added" toast bus.
 *
 * Anything that puts an item into the cart -- product cards on the
 * home carousel, related-products rail, product-detail sticky bar --
 * calls `useToastStore.getState().cartAdded()`. A single global
 * <CartToast /> mounted in the layout listens for the bump and slides
 * in for ~2s. Purely local to the page, no network side-effects.
 *
 * `bump` is a monotonic counter (not just a boolean) so a rapid
 * second add re-triggers the show effect even while the first toast
 * is still visible -- the effect deps on `bump`, so identical
 * consecutive additions all fire.
 */
type ToastState = {
  bump: number;
  cartAdded: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  bump: 0,
  cartAdded: () => set((s) => ({ bump: s.bump + 1 })),
}));
