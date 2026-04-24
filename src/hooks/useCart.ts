import React, { useState, useCallback, useEffect } from 'react';
import { Product, CartItem } from '../types';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const addToCart = useCallback((
    product: Product,
    options: {
      sauce?: string; observations?: string; quantity?: number;
      massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
    } = {}
  ) => {
    const { sauce, observations, quantity = 1, massa, recheio1, recheio2, adicionais = [] } = options;
    const cartId = [product.id, sauce, observations, massa, recheio1, recheio2, adicionais.join(',')]
      .map(v => v || 'none').join('-');

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...product, cartId, quantity, selectedSauce: sauce, observations, massa, recheio1, recheio2, adicionais }];
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
  }, []);

  const removeFromCart = useCallback((cartId: string) => {
    setCart(prev => {
      const item = prev.find(i => i.cartId === cartId);
      if (item && item.quantity > 1) return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity - 1 } : i);
      return prev.filter(i => i.cartId !== cartId);
    });
  }, []);

  const updateQuantity = useCallback((cartId: string, qty: number) => {
    if (qty <= 0) setCart(prev => prev.filter(i => i.cartId !== cartId));
    else setCart(prev => prev.map(i => i.cartId === cartId ? { ...i, quantity: qty } : i));
  }, []);

  const toggleCartItem = useCallback((product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setCart(prev => {
      const inCart = prev.some(i => i.id === product.id);
      return inCart ? prev.filter(i => i.id !== product.id) : [...prev, { ...product, cartId: product.id, quantity: 1, adicionais: [] }];
    });
  }, []);

  const clearCart = useCallback(() => setCart([]), []);

  return { cart, cartTotal, showSuccessToast, addToCart, removeFromCart, updateQuantity, toggleCartItem, clearCart };
}
