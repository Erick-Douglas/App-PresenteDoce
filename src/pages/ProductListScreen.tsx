import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Menu, Heart, ShoppingCart, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../config/constants';
import { PRODUCTS } from '../features/products/data';
import { Product, CartItem, View } from '../config/types';

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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-stone-50">

      {/* ── Header fixo ── */}
      <header className="sticky top-0 bg-white/85 backdrop-blur-lg z-50 border-b border-primary/5 shadow-[0_4px_20px_rgba(0,0,0,0.02)]">
        <div className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-5 pb-1 flex items-center gap-4">
          <button 
            onClick={onOpenMenu} 
            className="p-2.5 rounded-full bg-white border border-black/5 text-primary shadow-sm active:scale-95 transition-all hover:bg-stone-50 shrink-0 flex items-center justify-center"
          >
            <Menu size={20} />
          </button>
          <div className="flex-1 min-w-0">
            <p className="font-headline font-extrabold text-lg md:text-xl text-black tracking-tight truncate leading-tight flex items-center gap-2">
              <span className="text-xl">{activeCategory?.emoji}</span> {activeRecCategory === 'all' ? 'Cardápio Completo' : activeRecCategory}
            </p>
            <p className="text-[12px] text-black/40 font-body font-medium mt-0.5">{products.length} {products.length === 1 ? 'opção deliciosa' : 'opções deliciosas'}</p>
          </div>
        </div>

        {/* ── Tabs horizontais estilo iFood ── */}
        <div
          ref={tabsRef}
          className="flex overflow-x-auto scrollbar-hide px-4 gap-2 pt-4 pb-1"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {CATEGORIES.map(cat => {
            const isActive = activeRecCategory === cat.name;
            return (
              <button
                key={cat.name}
                data-active={isActive ? 'true' : 'false'}
                onClick={() => onSetCategory(cat.name)}
                className={`shrink-0 px-4 py-2 rounded-t-2xl font-headline font-bold text-[13px] tracking-wide transition-all whitespace-nowrap relative ${isActive
                  ? 'text-primary bg-primary/5'
                  : 'text-black/50 hover:text-black hover:bg-stone-100/50'
                  }`}
              >
                <span className="mr-1.5 opacity-90">{cat.emoji}</span>
                {cat.name}
                {/* Underline ativo */}
                {isActive && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className="absolute bottom-0 left-0 right-0 h-[3px] bg-primary rounded-t-full"
                  />
                )}
              </button>
            );
          })}
        </div>
        {/* Linha base das tabs */}
        <div className="h-[1px] bg-black/5 mx-0" />
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {products.map((product) => (
              <motion.div
                key={product.id}
                whileTap={{ scale: 0.98 }}
                className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/[0.03] flex flex-col relative cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group"
                onClick={() => onProductClick(product)}
              >
                {/* Imagem */}
                <div className="aspect-[4/3] w-full overflow-hidden relative bg-stone-100">
                  <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />

                  {/* Badges */}
                  <div className="absolute top-3 left-3 flex flex-col gap-1.5">
                    {product.isNew && (
                      <span className="bg-gold text-primary text-[9px] font-black px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">Novo</span>
                    )}
                    {product.configuravel && (
                      <span className="bg-primary text-cream text-[9px] font-black px-2 py-1 rounded-full shadow-sm uppercase tracking-wider">Personalizável</span>
                    )}
                  </div>

                  {/* Favorito */}
                  <button
                    className={`absolute top-3 right-3 p-2 rounded-full shadow-md backdrop-blur-md transition-transform active:scale-110 ${favorites.includes(product.id) ? 'bg-primary text-cream' : 'bg-white/90 text-primary hover:bg-white'}`}
                    onClick={(e) => onToggleFavorite(product.id, e)}
                  >
                    <Heart size={14} className={favorites.includes(product.id) ? 'fill-cream' : ''} />
                  </button>
                </div>

                {/* Info */}
                <div className="p-4 flex-1 flex flex-col gap-2 bg-white">
                  <h4 className="font-headline font-bold text-[13px] text-on-surface leading-snug line-clamp-2">{product.name}</h4>
                  <div className="flex justify-between items-center mt-auto pt-2">
                    <div>
                      {product.configuravel
                        ? <span className="font-body text-[10px] text-black/40 font-medium">a partir de</span>
                        : null}
                      <span className="font-headline font-black text-base md:text-lg text-primary block leading-tight">
                        € {product.price.toFixed(2)}
                      </span>
                    </div>
                    {product.configuravel ? (
                      <div className="bg-stone-100 text-primary p-2.5 rounded-xl shadow-black/5 shadow-sm group-hover:bg-primary group-hover:text-white transition-colors">
                        <ChevronRight size={16} />
                      </div>
                    ) : (
                      <motion.button
                        whileTap={{ scale: 0.9 }}
                        className={`${cart.some(i => i.id === product.id) ? 'bg-gold text-primary shadow-gold/30' : 'bg-stone-100 text-primary hover:bg-primary hover:text-white shadow-black/5'} p-2.5 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center`}
                        onClick={(e) => onToggleCartItem(product, e)}
                      >
                        <ShoppingCart size={16} className={cart.some(i => i.id === product.id) ? 'fill-primary' : ''} />
                      </motion.button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </motion.div>
  );
};
