import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItemPersisted } from "./supabase";

export type CartItem = CartItemPersisted & { id: string };

type CartState = {
  cart: CartItem[];
  addToCart: (item: Omit<CartItem, "id">) => void;
  updateQty: (id: string, qty: number) => void;
  removeFromCart: (id: string) => void;
  clearCart: () => void;
};

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      cart: [],
      addToCart: (item) => {
        const key = `${item.productId}|${item.size ?? ""}|${item.variant ?? ""}`;
        set((s) => {
          const existing = s.cart.find((c) => c.id === key);
          if (existing) {
            return {
              cart: s.cart.map((c) =>
                c.id === key ? { ...c, qty: c.qty + item.qty } : c,
              ),
            };
          }
          return { cart: [...s.cart, { ...item, id: key }] };
        });
      },
      updateQty: (id, qty) =>
        set((s) => ({
          cart: s.cart.map((c) => (c.id === id ? { ...c, qty } : c)).filter((c) => c.qty > 0),
        })),
      removeFromCart: (id) => set((s) => ({ cart: s.cart.filter((c) => c.id !== id) })),
      clearCart: () => set({ cart: [] }),
    }),
    { name: "okdx-cart" },
  ),
);

export function useCartCount() {
  return useCart((s) => s.cart.reduce((a, b) => a + b.qty, 0));
}
