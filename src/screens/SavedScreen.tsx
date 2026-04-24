import React from 'react';
import { motion } from 'motion/react';
import { Menu, Heart, ShoppingCart } from 'lucide-react';
import { PRODUCTS } from '../constants';
import { Product, CartItem, View } from '../types';

interface SavedScreenProps {
  cart: CartItem[];
  cartTotal: number;
  favorites: string[];
  onProductClick: (product: Product) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleCartItem: (product: Product, e?: React.MouseEvent) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const SavedScreen: React.FC<SavedScreenProps> = ({
  cart, cartTotal, favorites, onProductClick, onToggleFavorite, onToggleCartItem, onOpenMenu, onNavigate,
}) => {
  const favoriteProducts = PRODUCTS.filter(p => favorites.includes(p.id));

  return (
    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-6 flex items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-primary/5">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary"><Menu size={20} /></button>
        <h1 className="font-headline font-bold text-lg text-primary flex-1 text-center pr-8 tracking-widest uppercase">Favoritos</h1>
      </header>

      <main className="p-6">
        {favoriteProducts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-32 opacity-30 text-center space-y-4">
            <div className="bg-primary/10 p-6 rounded-full"><Heart size={48} className="text-primary" /></div>
            <p className="font-body text-sm font-bold">Você ainda não salvou nada.</p>
            <button onClick={() => onNavigate('home')} className="text-primary text-[10px] font-bold tracking-widest underline">
              Explorar produtos
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {favoriteProducts.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 flex flex-col relative active:scale-95 transition-all"
                onClick={() => onProductClick(product)}
              >
                <div className="h-40 w-full overflow-hidden relative">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  <div className="absolute top-2 right-2">
                    <button onClick={(e) => onToggleFavorite(product.id, e)} className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md text-primary">
                      <Heart size={12} className={favorites.includes(product.id) ? 'fill-primary' : ''} />
                    </button>
                  </div>
                </div>
                <div className="p-3 space-y-0.5">
                  <h4 className="font-headline font-semibold text-xs text-on-surface truncate leading-tight">{product.name}</h4>
                  <div className="flex justify-between items-center mt-auto">
                    <span className="font-headline font-bold text-sm text-primary">€ {product.price.toFixed(2)}</span>
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      className={`${cart.some(i => i.id === product.id) ? 'bg-gold text-primary' : 'bg-primary text-cream'} p-2 rounded-lg shadow-md transition-all flex items-center justify-center`}
                      onClick={(e) => onToggleCartItem(product, e)}
                    >
                      <ShoppingCart size={14} />
                    </motion.button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
}
