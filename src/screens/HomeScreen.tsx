import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Share2, Menu, Instagram, Facebook } from 'lucide-react';
import { PRODUCTS, CATEGORIES, BUSINESS_INFO } from '../constants';
import { Product, CartItem, User, View } from '../types';

interface HomeScreenProps {
  cart: CartItem[];
  cartTotal: number;
  user: User | null;
  favorites: string[];
  activeRecCategory: string;
  onOpenMenu: () => void;
  homeBgConfig: { type: 'color' | 'image'; value: string };
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleCartItem: (product: Product, e?: React.MouseEvent) => void;
  onNavigate: (view: View) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  cart, cartTotal, user, favorites, activeRecCategory,
  onOpenMenu, homeBgConfig,
  onSetCategory, onProductClick, onToggleFavorite, onToggleCartItem, onNavigate,
}) => {

  const handleShare = async () => {
    if (navigator.share) {
      try { await navigator.share({ title: 'Presente Doce', text: 'Descubra os melhores doces, bolos, tortas e kits para festas!', url: window.location.href }); }
      catch { /* cancelled */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-white">
      <main>
        {/* Hero Header */}
        <div
          className="px-6 pt-6 pb-24 relative overflow-hidden transition-all duration-700"
          style={{
            backgroundColor: homeBgConfig.type === 'color' ? homeBgConfig.value : undefined,
            backgroundImage: homeBgConfig.type === 'image' ? `url(${homeBgConfig.value})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {/* Header Controls */}
          <div className="flex justify-between items-center relative z-20 mb-4">
            <button
              onClick={onOpenMenu}
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-90 transition-all"
            >
              <Menu size={20} />
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl text-white border border-white/10 active:scale-90 transition-all flex items-center gap-2"
            >
              <Share2 size={18} />
              <span className="text-[10px] font-bold uppercase tracking-wider hidden sm:inline">Compartilhar</span>
            </button>
          </div>

          <div className="w-full flex flex-col items-center gap-2 relative z-10 py-4">
            {/* Logo Centralizado no Topo */}
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="flex flex-col items-center text-center"
            >
              <img
                src="/logo.png"
                alt="Presente Doce Logo"
                className="h-28 w-auto object-contain drop-shadow-2xl brightness-110"
              />
            </motion.div>
          </div>
        </div>

        {/* White content area */}
        <div className="-mt-12 bg-white rounded-t-[40px] relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.12)] pt-10 min-h-screen">
          <div className="max-w-[1200px] mx-auto space-y-8">
            {/* Category stories */}
            <section className="px-6">
              <div className="flex justify-between items-start gap-1 overflow-x-auto pb-2 scrollbar-hide">
                {CATEGORIES.map((cat, idx) => (
                  <div key={idx}
                    className="flex flex-col items-center gap-1.5 cursor-pointer shrink-0 active:scale-90 transition-transform scrollbar-hide"
                    onClick={() => { onSetCategory(cat.name); onNavigate('product-list'); }}
                  >
                    <div className="w-14 h-14 rounded-full p-[2px] bg-gradient-to-tr from-gold to-primary border-2 border-white shadow-md">
                      <div className="w-full h-full rounded-full border border-white overflow-hidden bg-cream/5">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <span className="font-headline font-black text-[12px] text-on-surface tracking-tight">{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* Products by category */}
            {CATEGORIES.map((category) => {
              const products = PRODUCTS.filter(p => p.category === category.name);
              if (products.length === 0) return null;
              return (
                <section key={category.name} className="px-6 space-y-2">
                  <div className="flex justify-between items-end">
                    <h3 className="font-headline font-black text-base text-black tracking-tighter">{category.name}</h3>
                    <button
                      onClick={() => { onSetCategory(category.name); onNavigate('product-list'); }}
                      className="text-black/60 border-b border-black/10 py-0.5 font-headline font-black text-[10px] hover:text-black hover:border-black transition-all"
                    >
                      Ver tudo
                    </button>
                  </div>
                  <div className="flex gap-4 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0 scrollbar-hide snap-x -mx-6 px-6 scroll-px-6 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-4 lg:gap-6">
                    {products.map((product) => (
                      <div key={product.id}
                        className="snap-start shrink-0 w-44 lg:w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 flex flex-col relative active:scale-98 transition-all"
                        onClick={() => onProductClick(product)}
                      >
                        <div className="h-36 w-full overflow-hidden relative">
                          <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                          <div className="absolute top-2 right-2">
                            <button
                              className={`p-1.5 rounded-full shadow-md backdrop-blur-md transition-transform active:scale-125 ${favorites.includes(product.id) ? 'bg-primary text-cream' : 'bg-white/80 text-primary'}`}
                              onClick={(e) => onToggleFavorite(product.id, e)}
                            >
                              <Heart size={12} className={favorites.includes(product.id) ? 'fill-cream' : ''} />
                            </button>
                          </div>
                        </div>
                        <div className="p-3 flex-1 flex flex-col gap-1.5">
                          <h4 className="font-headline font-semibold text-xs text-on-surface truncate pr-6 leading-tight">{product.name}</h4>
                          <div className="flex justify-between items-center mt-auto">
                            <span className="font-headline font-bold text-sm text-black">€ {product.price.toFixed(2)}</span>
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
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </motion.div>
  );
}
