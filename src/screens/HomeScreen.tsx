import React from 'react';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart, Share2, Menu } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { PRODUCTS } from '../PRODUCTS';
import { Product, CartItem, View } from '../types';

interface HomeScreenProps {
  cart: CartItem[];
  favorites: string[];
  onOpenMenu: () => void;
  homeBgConfig: { type: 'color' | 'image'; value: string };
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onToggleFavorite: (id: string, e?: React.MouseEvent) => void;
  onToggleCartItem: (product: Product, e?: React.MouseEvent) => void;
  onNavigate: (view: View) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  cart, favorites,
  onOpenMenu, homeBgConfig,
  onSetCategory, onProductClick, onToggleFavorite, onToggleCartItem, onNavigate,
}) => {
  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: 'Presente Doce', text: 'Descubra os melhores doces, bolos, tortas e kits para festas!', url: window.location.href });
      } catch { /* noop */ }
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert('Link copiado!');
    }
  };

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-white">
      <main>
        {/* ── Hero (fundo bordô, full-width) ── */}
        <div
          className="relative overflow-hidden transition-all duration-700 pb-10 pt-6"
          style={{
            backgroundColor: homeBgConfig.type === 'color' ? homeBgConfig.value : undefined,
            backgroundImage: homeBgConfig.type === 'image' ? `url(${homeBgConfig.value})` : undefined,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Container interno centralizado */}
          <div className="max-w-[1200px] mx-auto px-6">
            {/* Barra do topo */}
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

            {/* Logo centralizada */}
            <div className="flex flex-col items-center relative z-10 py-6">
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <img src="/logo.png" alt="Presente Doce Logo" className="h-28 md:h-36 w-auto object-contain drop-shadow-2xl brightness-110" />
              </motion.div>
            </div>
          </div>
        </div>

        {/* ── Conteúdo branco (full-width com curva no topo) ── */}
        <div className="-mt-16 bg-white rounded-t-[40px] relative z-20 shadow-[0_-20px_40px_rgba(0,0,0,0.12)] pt-10 min-h-screen">
          <div className="max-w-[1200px] mx-auto space-y-8">

            {/* Categorias */}
            <section className="px-6">
              <div className="flex justify-around items-start gap-2 sm:gap-4 pb-2">
                {CATEGORIES.map((cat) => (
                  <div
                    key={cat.name}
                    className="flex flex-col items-center gap-1.5 cursor-pointer active:scale-90 transition-transform"
                    onClick={() => { onSetCategory(cat.name); onNavigate('product-list'); }}
                  >
                    <div className="w-14 h-14 md:w-16 md:h-16 rounded-full p-[2px] bg-gradient-to-tr from-gold to-primary border-2 border-white shadow-md">
                      <div className="w-full h-full rounded-full border border-white overflow-hidden">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <span className="font-headline font-black text-[10px] text-on-surface tracking-tight text-center max-w-[64px] leading-tight">{cat.name}</span>
                  </div>
                ))}
              </div>
            </section>

            {/* ── Destaques da Semana ── */}
            {(() => {
              const topSellers = [1, 2, 3]
                .map(pos => PRODUCTS.find(p => p.topSeller === pos))
                .filter(Boolean) as typeof PRODUCTS;

              if (topSellers.length === 0) return null;

              return (
                <section className="space-y-3">
                  {/* Título — mesmo padrão das outras categorias */}
                  <div className="px-6 flex justify-between items-end">
                    <div>
                      <h3 className="font-headline font-black text-base text-black tracking-tighter">
                        Mais pedidos da semana 🔥
                      </h3>
                    </div>
                  </div>

                  {/* Cards — scroll mobile, grid desktop */}
                  <div className="flex gap-4 overflow-x-auto md:overflow-visible scrollbar-hide snap-x -mx-0 px-6 pb-2 md:grid md:grid-cols-3 md:gap-5 md:pb-0">
                    {topSellers.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => onProductClick(product)}
                        className="snap-start shrink-0 w-48 md:w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-black/[0.06] cursor-pointer hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                      >
                        {/* Imagem sem badge de número */}
                        <div className="relative h-36 md:h-44 w-full overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Info */}
                        <div className="p-3 flex flex-col gap-1">
                          <h4 className="font-headline font-semibold text-xs text-black leading-tight line-clamp-2">{product.name}</h4>
                          <div className="flex justify-between items-center mt-1">
                            <span className="font-headline font-black text-sm text-primary">€ {product.price.toFixed(2)}</span>
                            <motion.button
                              whileTap={{ scale: 0.9 }}
                              onClick={(e) => onToggleCartItem(product, e)}
                              className={`${cart.some(i => i.id === product.id) ? 'bg-gold text-primary' : 'bg-primary text-cream'} w-7 h-7 rounded-lg flex items-center justify-center shadow-sm transition-colors`}
                            >
                              <ShoppingCart size={12} />
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </section>
              );
            })()}

            {/* Produtos por categoria */}
            {CATEGORIES.map((category) => {
              const products = PRODUCTS.filter(p => p.category === category.name);
              if (products.length === 0) return null;

              return (
                <section key={category.name} className="px-6 space-y-3">
                  <div className="flex justify-between items-end">
                    <h3 className="font-headline font-black text-base text-black tracking-tighter">{category.name}</h3>
                    <button
                      onClick={() => { onSetCategory(category.name); onNavigate('product-list'); }}
                      className="text-black/60 border-b border-black/10 py-0.5 font-headline font-black text-[10px] hover:text-black hover:border-black transition-all"
                    >
                      Ver tudo
                    </button>
                  </div>

                  {/* Mobile: scroll horizontal | Desktop: grid */}
                  <div className="flex gap-4 overflow-x-auto md:overflow-visible pb-4 md:pb-0 scrollbar-hide snap-x -mx-6 px-6 md:mx-0 md:px-0 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-5">
                    {products.map((product) => (
                      <div
                        key={product.id}
                        className="snap-start shrink-0 w-44 md:w-full bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 flex flex-col relative cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-[0.98] transition-all duration-200"
                        onClick={() => onProductClick(product)}
                      >
                        <div className="h-36 md:h-44 w-full overflow-hidden relative">
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
                          <h4 className="font-headline font-semibold text-xs text-on-surface leading-tight line-clamp-2">{product.name}</h4>
                          <div className="flex justify-between items-center mt-auto pt-1">
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
};
