import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronRight } from 'lucide-react';
import { View, CartItem } from '../types';

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
          className="fixed bottom-6 left-1/2 -translate-x-1/2 w-full max-w-screen-xl px-6 z-[90]"
        >
          <button
            onClick={() => onNavigate('cart')}
            className="w-full bg-primary text-white p-4 rounded-2xl shadow-2xl shadow-primary/30 flex items-center justify-between group active:scale-[0.98] transition-all border border-white/10 backdrop-blur-md"
          >
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center shadow-inner">
                  <ShoppingBag size={22} className="text-white" />
                </div>
                <span className="absolute -top-2 -right-2 w-6 h-6 bg-gold text-primary font-black text-[10px] rounded-full flex items-center justify-center border-2 border-primary shadow-lg">
                  {cart.reduce((s, i) => s + i.quantity, 0)}
                </span>
              </div>
              <div className="text-left">
                <p className="text-[10px] font-bold uppercase tracking-widest text-cream/60">Ver Carrinho</p>
                <p className="font-headline font-black text-lg leading-none">€ {cartTotal.toFixed(2)}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">Finalizar</span>
              <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center">
                <ChevronRight size={16} />
              </div>
            </div>
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
