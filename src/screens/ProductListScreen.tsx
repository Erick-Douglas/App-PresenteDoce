import React from 'react';
import { motion } from 'framer-motion';
import { Menu, Heart, ShoppingCart, ArrowLeft } from 'lucide-react';
import { PRODUCTS, CATEGORIES } from '../constants';
import { Product, CartItem, View } from '../types';

interface ProductListScreenProps {
  cart: CartItem[];
  cartTotal: number;
  favorites: string[];
  activeRecCategory: string;
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleCartItem: (product: Product, e?: React.MouseEvent) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const ProductListScreen: React.FC<ProductListScreenProps> = ({
  cart, cartTotal, favorites, activeRecCategory,
  onSetCategory, onProductClick, onToggleFavorite, onToggleCartItem, onOpenMenu, onNavigate,
}) => {
  const products = activeRecCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeRecCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-white">
      <header className="px-6 py-6 flex items-center sticky top-0 bg-white/80 backdrop-blur-md z-50 border-b border-primary/5">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary">
          <Menu size={20} />
        </button>
        <h1 className="font-headline font-bold text-lg text-primary flex-1 text-center pr-8 uppercase tracking-widest">
          {activeRecCategory === 'all' ? 'Cardápio' : activeRecCategory}
        </h1>
      </header>

      <main className="p-6 max-w-[1200px] mx-auto">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 flex flex-col relative active:scale-95 transition-all"
              onClick={() => onProductClick(product)}
            >
              <div className="h-40 w-full overflow-hidden relative">
                <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                <div className="absolute top-2 right-2">
                  <button
                    className="p-2 bg-white/90 backdrop-blur-md rounded-full shadow-md text-primary active:scale-125 transition-transform"
                    onClick={(e) => onToggleFavorite(product.id, e)}
                  >
                    <Heart size={12} className={favorites.includes(product.id) ? 'fill-primary' : ''} />
                  </button>
                </div>
              </div>
              <div className="p-3 space-y-1">
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

        <div className="mt-16 pt-10 border-t border-primary/5 space-y-6">
          <p className="text-center font-headline font-bold text-[10px] text-black/30">Navegue por mais</p>
          <div className="flex flex-wrap justify-center gap-2">
            {CATEGORIES.map(cat => (
              <button
                key={cat.name}
                onClick={() => onSetCategory(cat.name)}
                className={`px-4 py-2 rounded-full font-headline font-bold text-[10px] border transition-all ${activeRecCategory === cat.name ? 'bg-primary text-cream border-primary' : 'bg-white text-black/60 border-primary/10'}`}
              >
                {cat.name}
              </button>
            ))}
          </div>
          <button onClick={() => onNavigate('home')} className="w-full flex items-center justify-center gap-2 py-4 text-primary font-bold text-xs hover:underline mt-4">
            <ArrowLeft size={16} /> Voltar ao início
          </button>
        </div>
      </main>
    </motion.div>
  );
}
