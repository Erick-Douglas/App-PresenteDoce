import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { View, CartItem } from '../config/types';
import { formatEuros } from '../features/checkout/order';

interface FloatingCartProps {
  cart: CartItem[];
  cartTotal: number;
  onNavigate: (view: View) => void;
  isVisible: boolean;
}

export function FloatingCart({ cart, cartTotal, onNavigate, isVisible }: FloatingCartProps) {
  if (cart.length === 0) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          className="fixed bottom-[max(1rem,env(safe-area-inset-bottom))] left-0 right-0 z-[90] flex justify-center px-4"
        >
          <button type="button"
            onClick={() => onNavigate('cart')}
            className="ui-primary flex w-full max-w-lg items-center justify-between gap-3 shadow-md"
          >
            <span className="flex items-center gap-2">
                <ShoppingBag size={17} strokeWidth={1.65} aria-hidden="true" />
                <span>Ver carrinho</span>
                <span className="rounded-full bg-surface/15 px-1.5 text-xs tabular-nums">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="type-price">{formatEuros(cartTotal)}</span>
              <ChevronRight size={15} aria-hidden="true" />
            </span>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
