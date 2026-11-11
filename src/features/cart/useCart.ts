import React, { useState, useCallback } from 'react';
import { Product, CartItem } from '../../config/types';
import { orderSubtotal } from '../checkout/order';

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showSuccessToast, setShowSuccessToast] = useState(false);

  const cartTotal = orderSubtotal(cart);

  const addToCart = useCallback((
    product: Product,
    options: {
      sauce?: string; observations?: string; quantity?: number;
      massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
      tamanho?: string; tema?: string;
      variant?: string; selectedFlavors?: string[];
    } = {}
  ) => {
    const { sauce, observations, quantity = 1, massa, recheio1, recheio2, adicionais = [], tamanho, tema, variant, selectedFlavors = [] } = options;
    const cartId = JSON.stringify([product.id, product.price, sauce, tamanho, massa, recheio1, recheio2, adicionais, variant, selectedFlavors, observations, tema]);

    setCart(prev => {
      const existing = prev.find(i => i.cartId === cartId);
      if (existing) {
        return prev.map(i => i.cartId === cartId ? { ...i, quantity: i.quantity + quantity } : i);
      }
      return [...prev, { ...product, cartId, quantity, selectedSauce: sauce, observations, massa, recheio1, recheio2, adicionais, tamanho, tema, variant, selectedFlavors }];
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

  const updateCartItem = useCallback((
    oldCartId: string,
    product: Product,
    options: {
      sauce?: string; observations?: string; quantity?: number;
      massa?: string; recheio1?: string; recheio2?: string; adicionais?: string[];
      tamanho?: string; tema?: string;
      variant?: string; selectedFlavors?: string[];
    } = {}
  ) => {
    const { sauce, observations, quantity = 1, massa, recheio1, recheio2, adicionais = [], tamanho, tema, variant, selectedFlavors = [] } = options;
    const newCartId = JSON.stringify([product.id, product.price, sauce, tamanho, massa, recheio1, recheio2, adicionais, variant, selectedFlavors, observations, tema]);

    setCart(prev => {
      const index = prev.findIndex(i => i.cartId === oldCartId);
      if (index === -1) return prev; // old item not found
      
      const newItem = { ...product, cartId: newCartId, quantity, selectedSauce: sauce, observations, massa, recheio1, recheio2, adicionais, tamanho, tema, variant, selectedFlavors };
      const other = prev.findIndex((item, i) => i !== index && item.cartId === newCartId);
      if (other === -1) return prev.map((item, i) => i === index ? newItem : item);
      return prev.map((item, i) => i === other ? { ...item, quantity: item.quantity + quantity } : item).filter((_, i) => i !== index);
    });

    setShowSuccessToast(true);
    setTimeout(() => setShowSuccessToast(false), 3000);
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

  return { cart, cartTotal, showSuccessToast, addToCart, removeFromCart, updateQuantity, toggleCartItem, clearCart, updateCartItem };
}
