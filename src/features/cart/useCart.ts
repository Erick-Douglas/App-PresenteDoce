import React, { useCallback, useEffect, useRef, useState } from "react";
import type { CartItem, Product } from "../../config/types";
import type { Selections } from "../products/options";
import { orderSubtotal } from "../checkout/order";
export type CartOptions = {
  sauce?: string;
  observations?: string;
  quantity?: number;
  massa?: string;
  recheio1?: string;
  recheio2?: string;
  adicionais?: string[];
  tamanho?: string;
  tema?: string;
  mode?: "ready" | "preorder";
  variant?: string;
  selectedFlavors?: string[];
  selections?: Selections;
  basePrice?: number;
};
function itemFrom(product: Product, o: CartOptions): CartItem {
  const options = {
    ...o,
    mode: o.mode ?? product.saleModes?.[0] ?? "preorder",
    adicionais: o.adicionais ?? [],
    selectedFlavors: o.selectedFlavors ?? [],
    selections: o.selections ?? {},
  };
  const normalizedSelections = Object.fromEntries(
    Object.entries(options.selections)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, ids]) => [key, [...ids].sort()]),
  );
  const cartId = JSON.stringify([
    product.id,
    options.mode,
    product.price,
    options.sauce,
    options.tamanho,
    options.massa,
    options.recheio1,
    options.recheio2,
    options.adicionais,
    options.variant,
    options.selectedFlavors,
    normalizedSelections,
    options.observations,
    options.tema,
  ]);
  return {
    ...product,
    ...options,
    cartId,
    quantity: o.quantity ?? 1,
    selectedSauce: o.sauce,
    basePrice: o.basePrice ?? product.price,
  };
}
export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]),
    [showSuccessToast, setFeedback] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const flash = useCallback(() => {
    clearTimeout(timer.current);
    setFeedback(true);
    timer.current = setTimeout(() => setFeedback(false), 1600);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  const addToCart = useCallback(
    (product: Product, options: CartOptions = {}) => {
      const next = itemFrom(product, options);
      setCart((items) => {
        const found = items.find((i) => i.cartId === next.cartId);
        return found
          ? items.map((i) =>
              i === found ? { ...i, quantity: i.quantity + next.quantity } : i,
            )
          : [...items, next];
      });
      flash();
    },
    [flash],
  );
  const updateCartItem = useCallback(
    (oldId: string, product: Product, options: CartOptions = {}) => {
      const next = itemFrom(product, options);
      setCart((items) => {
        if (!items.some((i) => i.cartId === oldId)) return items;
        const other = items.find(
          (i) => i.cartId !== oldId && i.cartId === next.cartId,
        );
        return other
          ? items
              .filter((i) => i.cartId !== oldId)
              .map((i) =>
                i === other
                  ? { ...i, quantity: i.quantity + next.quantity }
                  : i,
              )
          : items.map((i) => (i.cartId === oldId ? next : i));
      });
      flash();
    },
    [flash],
  );
  const updateQuantity = useCallback(
    (id: string, quantity: number) =>
      setCart((items) =>
        quantity <= 0
          ? items.filter((i) => i.cartId !== id)
          : items.map((i) => (i.cartId === id ? { ...i, quantity } : i)),
      ),
    [],
  );
  const removeFromCart = useCallback(
    (id: string) =>
      setCart((items) =>
        items.flatMap((i) =>
          i.cartId !== id
            ? [i]
            : i.quantity > 1
              ? [{ ...i, quantity: i.quantity - 1 }]
              : [],
        ),
      ),
    [],
  );
  const toggleCartItem = useCallback(
    (p: Product, e?: React.MouseEvent) => {
      e?.stopPropagation();
      addToCart(p);
    },
    [addToCart],
  );
  return {
    cart,
    cartTotal: orderSubtotal(cart),
    showSuccessToast,
    addToCart,
    updateCartItem,
    updateQuantity,
    removeFromCart,
    toggleCartItem,
    clearCart: useCallback(() => setCart([]), []),
  };
}
