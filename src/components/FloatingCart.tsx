import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, ChevronRight } from "lucide-react";
import type { View, CartItem } from "../config/types";
import { formatEuros } from "../features/checkout/order";
export function FloatingCart({
  cart,
  cartTotal,
  onNavigate,
  isVisible,
  added = false,
}: {
  cart: CartItem[];
  cartTotal: number;
  onNavigate: (view: View) => void;
  isVisible: boolean;
  added?: boolean;
}) {
  if (!cart.length) return null;
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: 24, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 24, opacity: 0 }}
          className="floating-cart"
        >
          <motion.button
            type="button"
            className="cart-summary"
            onClick={() => onNavigate("cart")}
            animate={added ? { scale: [1, 1.025, 1] } : { scale: 1 }}
            transition={{ duration: 0.35 }}
          >
            <span className="flex items-center gap-2">
              <ShoppingBag
                size={22}
                strokeWidth={1.7}
                className="cart-bag-icon"
              />
              <span>Ver carrinho</span>
              <span className="cart-quantity">
                {cart.reduce((n, i) => n + i.quantity, 0)}
              </span>
            </span>
            <span className="flex items-center gap-2 whitespace-nowrap">
              <span className="type-price">{formatEuros(cartTotal)}</span>
              <ChevronRight size={16} />
            </span>
            <span className="sr-only" role="status">
              {added ? "Carrinho atualizado" : ""}
            </span>
          </motion.button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
