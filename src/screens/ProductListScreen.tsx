import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Heart, ShoppingCart, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { PRODUCTS } from '../PRODUCTS';
import { Product, CartItem, View } from '../types';

interface ProductListScreenProps {
  cart: CartItem[];
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
  cart, favorites, activeRecCategory,
  onSetCategory, onProductClick, onToggleFavorite, onToggleCartItem, onOpenMenu,
}) => {
  const products = activeRecCategory === 'all'
    ? PRODUCTS
    : PRODUCTS.filter(p => p.category === activeRecCategory);

  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll a tab ativa para o centro ao mudar de categoria
  useEffect(() => {
    const container = tabsRef.current;
    if (!container) return;
    const activeTab = container.querySelector('[data-active="true"]') as HTMLElement | null;
    if (activeTab) {
      const offset = activeTab.offsetLeft - container.clientWidth / 2 + activeTab.clientWidth / 2;
      container.scrollTo({ left: offset, behavior: 'smooth' });
    }
  }, [activeRecCategory]);

  const activeCategory = CATEGORIES.find(c => c.name === activeRecCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-white">

      {/* ── Header fixo ── */}
      <header className="sticky top-0 bg-white/95 backdrop-blur-md z-50 border-b border-primary/5 shadow-sm">
        <div className="max-w-[1200px] mx-auto px-6 pt-4 pb-0 flex items-center gap-3">
          <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary shrink-0">
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-black text-base text-primary truncate leading-tight">
              {activeCategory?.emoji} {activeRecCategory === 'all' ? 'Cardápio completo' : activeRecCategory}
            </p>
            <p className="text-[10px] text-black/30 font-body">{products.length} {products.length === 1 ? 'produto' : 'produtos'}</p>
          </div>
        </div>

        {/* ── Tabs horizontais estilo iFood ── */}
        <div
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-hide px-4 gap-1 pt-3 pb-0"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeRecCategory === cat.name;
            return (
              <button
                key={cat.name}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => onSetCategory(cat.name)}
                className={`shrink-0 px-4 py-2 rounded-t-xl font-headline font-black text-[11px] tracking-wide transition-all whitespace-nowrap relative ${isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-black/40 hover:text-black/70'
                  }`}
              >
                <span className="mr-1">{cat.emoji}</span>
                {cat.name}
                {/* Underline ativo */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-primary rounded-full"
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Linha base das tabs */}
        <div className="h-[2.5px] bg-primary/5 mx-0" />
      </header>

      {/* ── Banner 48h — só aparece em Bolos Temáticos ── */}
      {activeRecCategory === 'Bolos Temáticos' && (
        <div className="max-w-[1200px] mx-auto px-5 pt-4">
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary to-primary/80 px-5 py-4 flex items-center gap-4">
            {/* Fundo decorativo */}
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[56px] opacity-10 select-none pointer-events-none">🎂</span>

            <div className="text-3xl shrink-0">🎂</div>
            <div className="flex-1 min-w-0">
              <p className="font-headline font-black text-cream text-[13px] leading-tight mb-0.5">
                Feito com carinho, sob encomenda!
              </p>
              <p className="font-body text-cream/80 text-[11px] leading-snug">
                Nossos bolos temáticos precisam de <span className="font-bold text-gold">mínimo 48h</span> de antecedência. Tem urgência? Fala connosco no WhatsApp! 💬
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ── Lista de produtos ── */}
      <main className="max-w-[1200px] mx-auto p-5">
        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
            <span className="text-5xl">🍰</span>
            <p className="font-headline font-bold text-sm text-black/30">Nenhum produto nesta categoria ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-2xl overflow-hidden shadow-sm border border-primary/5 flex flex-col relative cursor-pointer hover:shadow-md hover:-translate-y-0.5 active:scale-95 transition-all duration-200"
                onClick={() => onProductClick(product)}
              >
                {/* Imagem */}
                <div className="aspect-square w-full overflow-hidden relative bg-stone-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />

                  {/* Badges */}
                  <div className="absolute top-2 left-2 flex flex-col gap-1">
                    {product.isNew && (
                      <span className="bg-gold text-primary text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm uppercase">Novo</span>
                    )}
                    {product.configuravel && (
                      <span className="bg-primary text-cream text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-sm uppercase">Personalizável</span>
                    )}
                  </div>

                  {/* Favorito */}
                  <button
                    className={`absolute top-2 right-2 p-1.5 rounded-full shadow-md backdrop-blur-md transition-transform active:scale-125 ${favorites.includes(product.id) ? 'bg-primary text-cream' : 'bg-white/80 text-primary'}`}
                    onClick={(e) => onToggleFavorite(product.id, e)}
                  >
                    <Heart size={12} className={favorites.includes(product.id) ? 'fill-cream' : ''} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-3 flex-1 flex flex-col gap-1">
                  <h4 className="font-headline font-semibold text-xs text-on-surface leading-tight line-clamp-2">{product.name}</h4>
                  <div className="flex justify-between items-center mt-auto pt-1">
                    <div>
                      {product.configuravel
                        ? <span className="font-body text-[9px] text-black/40">a partir de</span>
                        : null}
                      <span className="font-headline font-bold text-sm text-primary block leading-tight">
                        € {product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.configuravel ? (
                      <div className="bg-primary/10 text-primary p-1.5 rounded-lg">
                        <ChevronRight size={14} />
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className={`${cart.some(i => i.id === product.id) ? 'bg-gold text-primary' : 'bg-primary text-cream'} p-2 rounded-lg shadow-md transition-all flex items-center justify-center`}
                        onClick={(e) => onToggleCartItem(product, e)}
                      >
                        <ShoppingCart size={14} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
};
