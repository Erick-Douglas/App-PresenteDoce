import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Home as HomeIcon, Heart, ShoppingCart, User as UserIcon } from 'lucide-react';
import { View, CartItem } from '../types';

interface BottomNavProps {
  active?: View;
  cart: CartItem[];
  cartTotal: number;
  hasScrolledOnce: boolean;
  showBottomNav: boolean;
  onNavigate: (view: View) => void;
}

export function BottomNav({ active = 'home', cart, cartTotal, hasScrolledOnce, showBottomNav, onNavigate }: BottomNavProps) {
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const shouldShow = hasScrolledOnce || showBottomNav;

  return (
    <AnimatePresence>
      {shouldShow && (
        <motion.div
          initial={{ y: '100%', opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: '100%', opacity: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-0 left-0 right-0 z-50 flex justify-center px-4 md:px-0"
        >
          <nav className="w-full max-w-lg md:max-w-xl bg-primary/95 backdrop-blur-2xl border-t border-white/10 shadow-[0_-15px_40px_rgba(0,0,0,0.4)] flex justify-around items-center h-20 rounded-t-[32px] px-2 mb-4 md:mb-6">
            <button
              onClick={() => onNavigate('home')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-500 ${active === 'home' ? 'text-gold' : 'text-cream/30'}`}
            >
              <HomeIcon size={20} className={active === 'home' ? 'fill-gold' : ''} />
              <span className="text-[8px] font-bold leading-none">Início</span>
            </button>

            <button
              onClick={() => onNavigate('saved')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-500 ${active === 'saved' ? 'text-gold' : 'text-cream/30'}`}
            >
              <Heart size={20} className={active === 'saved' ? 'fill-gold' : ''} />
              <span className="text-[8px] font-bold leading-none">Salvos</span>
            </button>

            <button
              onClick={() => onNavigate('cart')}
              className={`relative flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-500 ${active === 'cart' ? 'text-gold' : 'text-cream/30'}`}
            >
              <div className="relative">
                <ShoppingCart size={20} className={active === 'cart' ? 'fill-gold' : ''} />
                {itemCount > 0 && (
                  <motion.div
                    initial={{ scale: 0.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    key={itemCount}
                    className="absolute -top-2 -right-2 bg-gold text-primary text-[9px] font-black w-4 h-4 rounded flex items-center justify-center shadow-lg border border-primary/20"
                  >
                    {itemCount}
                  </motion.div>
                )}
              </div>
              <span className="text-[8px] font-bold leading-none">
                {cartTotal > 0 ? `€ ${cartTotal.toFixed(0)}` : 'Carrinho'}
              </span>
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-500 ${active === 'profile' ? 'text-gold' : 'text-cream/30'}`}
            >
              <UserIcon size={20} className={active === 'profile' ? 'fill-gold' : ''} />
              <span className="text-[8px] font-bold leading-none">Perfil</span>
            </button>
          </nav>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
