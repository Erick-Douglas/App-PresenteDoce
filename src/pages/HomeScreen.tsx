import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, ShoppingCart, Search } from 'lucide-react';
import { CATEGORIES } from '../config/constants';
import { PRODUCTS } from '../features/products/data';
import { Product, CartItem, View } from '../config/types';
import { Header } from '../components/Header';

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
  const topSellersImages = useMemo(() => [1, 2, 3]
    .map(pos => PRODUCTS.find(p => p.topSeller === pos)?.image)
    .filter(Boolean) as string[], []);

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (topSellersImages.length === 0) return;
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % topSellersImages.length);
    }, 4500);
    return () => clearInterval(interval);
  }, [topSellersImages.length]);

  const filteredProducts = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const query = searchQuery.toLowerCase();
    return PRODUCTS.filter(p => p.name.toLowerCase().includes(query) || p.description?.toLowerCase().includes(query));
  }, [searchQuery]);

  // Função auxiliar para renderizar os cards de forma consistente
  const renderProductCard = (product: Product, isTopSeller = false) => (
    <motion.div
      key={product.id}
      whileTap={{ scale: 0.98 }}
      onClick={() => onProductClick(product)}
      className={`snap-start shrink-0 ${isTopSeller ? 'w-[200px]' : 'w-[180px]'} md:w-full bg-white rounded-3xl overflow-hidden shadow-[0_4px_20px_rgba(0,0,0,0.02)] border border-black/[0.03] flex flex-col relative cursor-pointer hover:shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 group`}
    >
      <div className="aspect-[4/3] w-full overflow-hidden relative bg-stone-100">
        <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" referrerPolicy="no-referrer" />
        <div className="absolute top-3 right-3">
          <button
            className={`p-2 rounded-full shadow-md backdrop-blur-md transition-transform active:scale-110 ${favorites.includes(product.id) ? 'bg-primary text-cream' : 'bg-white/90 text-primary hover:bg-white'}`}
            onClick={(e) => onToggleFavorite(product.id, e)}
          >
            <Heart size={14} className={favorites.includes(product.id) ? 'fill-cream' : ''} />
          </button>
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col gap-2 bg-white">
        <h4 className="font-headline font-bold text-[13px] text-on-surface leading-snug line-clamp-2">{product.name}</h4>
        <div className="flex justify-between items-center mt-auto pt-2">
          <span className="font-headline font-black text-base md:text-lg text-primary">€ {product.price.toFixed(2)}</span>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={(e) => onToggleCartItem(product, e)}
            className={`${cart.some(i => i.id === product.id) ? 'bg-gold text-primary shadow-gold/30' : 'bg-stone-100 text-primary hover:bg-primary hover:text-white shadow-black/5'} w-9 h-9 md:w-auto md:px-3 md:py-2 rounded-xl shadow-md transition-all duration-300 flex items-center justify-center`}
          >
            <ShoppingCart size={16} className={cart.some(i => i.id === product.id) ? 'fill-primary' : ''} />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen pb-32 bg-stone-50">
      <Header onOpenMenu={onOpenMenu} />
      
      <main>
        {/* ── Hero Carousel ── */}
        <div className="relative overflow-hidden w-full h-[320px] md:h-[420px] bg-stone-100 z-10">
          <AnimatePresence initial={false}>
            {topSellersImages.length > 0 && (
              <motion.img
                key={currentImageIndex}
                src={topSellersImages[currentImageIndex]}
                initial={{ opacity: 0, scale: 1.05 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            )}
          </AnimatePresence>
          {/* Overlay escuro sutil no topo e base */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/30 z-10 pointer-events-none" />

          {/* ── Barra de Busca (Formato pílula, cinza leve) ── */}
          <div className="absolute bottom-12 left-0 right-0 z-30 px-6">
            <div className="max-w-sm md:max-w-md mx-auto bg-stone-100 rounded-2xl py-1 px-2 flex items-center shadow-md">
              <Search size={18} className="text-black/40 ml-2 shrink-0" />
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="O que você procura?" 
                className="flex-1 bg-transparent px-3 py-1.5 outline-none font-body text-[14px] text-black placeholder:text-black/40"
              />
            </div>
          </div>
        </div>

        {/* ── Conteúdo principal ── */}
        <div className="-mt-8 bg-stone-50 rounded-t-[32px] md:rounded-t-[48px] relative z-20 shadow-[0_-8px_30px_rgba(0,0,0,0.04)] pt-8 min-h-screen">
          <div className="max-w-[1200px] mx-auto space-y-6">

            {/* Renderização condicional baseada na busca */}
            {filteredProducts ? (
              <section className="px-2 md:px-6 space-y-4 pt-2">
                <div className="px-4">
                  <h3 className="font-headline font-extrabold text-lg md:text-xl text-black tracking-tight">
                    Resultados para "{searchQuery}"
                  </h3>
                  <p className="font-body text-sm text-black/50 mt-1">{filteredProducts.length} {filteredProducts.length === 1 ? 'item encontrado' : 'itens encontrados'}</p>
                </div>
                
                {filteredProducts.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center gap-4">
                    <span className="text-5xl opacity-50">🍰</span>
                    <p className="font-headline font-bold text-sm text-black/40">Nenhum produto encontrado com esse nome.</p>
                  </div>
                ) : (
                  <div className="flex gap-4 overflow-x-auto md:overflow-visible pb-4 pt-1 md:pb-0 scrollbar-hide snap-x px-4 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                    {filteredProducts.map(p => renderProductCard(p))}
                  </div>
                )}
              </section>
            ) : (
              <>

            {/* Categorias */}
            <section className="px-4 md:px-6">
              <div className="flex items-start gap-2 md:gap-6 pb-2 overflow-x-auto scrollbar-hide snap-x px-2 md:px-0 md:justify-center">
                {CATEGORIES.map((cat, idx) => (
                  <motion.div
                    key={cat.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05, duration: 0.4 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="flex flex-col items-center gap-2 cursor-pointer shrink-0 snap-center group w-[90px] md:w-[120px]"
                    onClick={() => { onSetCategory(cat.name); onNavigate('product-list'); }}
                  >
                    <div className="w-20 h-20 md:w-28 md:h-28 rounded-full p-[3px] bg-gradient-to-tr from-gold/80 to-primary/80 group-hover:from-gold group-hover:to-primary transition-colors shadow-sm group-hover:shadow-md">
                      <div className="w-full h-full rounded-full border-2 border-white overflow-hidden bg-white">
                        <img src={cat.image} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" referrerPolicy="no-referrer" />
                      </div>
                    </div>
                    <span className="font-headline font-extrabold text-[14px] md:text-[16px] text-on-surface tracking-tight text-center leading-tight opacity-90 group-hover:opacity-100 transition-opacity">{cat.name}</span>
                  </motion.div>
                ))}
              </div>
            </section>

            {/* ── Banners Promocionais (Slider) ── */}
            <section className="px-4 md:px-6">
              <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-2 md:grid md:grid-cols-3">
                {/* Banner 1: Bolos Temáticos */}
                <div onClick={() => { onSetCategory('Bolos Temáticos'); onNavigate('product-list'); }} className="snap-center shrink-0 w-full h-[160px] md:h-[190px] rounded-2xl overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer group">
                  <img src={PRODUCTS.find(p => p.category === 'Bolos Temáticos')?.image || ''} alt="Bolos Temáticos" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/40 to-transparent flex items-center p-6">
                    <div>
                      <h3 className="text-white font-headline font-black text-xl md:text-2xl leading-tight uppercase tracking-wide">Bolos<br/>Incríveis</h3>
                      <p className="text-white/80 font-body text-[12px] md:text-[14px] mt-1.5 font-bold">Designs que impressionam</p>
                    </div>
                  </div>
                </div>
                {/* Banner 2: Boxes Surpresa */}
                <div onClick={() => { onSetCategory('Boxes Surpresa'); onNavigate('product-list'); }} className="snap-center shrink-0 w-full h-[160px] md:h-[190px] rounded-2xl overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer group">
                  <img src={PRODUCTS.find(p => p.category === 'Boxes Surpresa')?.image || ''} alt="Boxes Surpresa" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/50 to-transparent flex items-center p-6">
                    <div>
                      <h3 className="text-white font-headline font-black text-xl md:text-2xl leading-tight uppercase tracking-wide">Surpreenda<br/>Alguém</h3>
                      <p className="text-white/80 font-body text-[12px] md:text-[14px] mt-1.5 font-bold">Boxes inesquecíveis</p>
                    </div>
                  </div>
                </div>
                {/* Banner 3: Pronta Entrega */}
                <div onClick={() => onNavigate('product-list')} className="snap-center shrink-0 w-full h-[160px] md:h-[190px] rounded-2xl overflow-hidden relative shadow-[0_4px_20px_rgba(0,0,0,0.05)] cursor-pointer group">
                  <img src={PRODUCTS.find(p => p.category === 'Brigadeiros')?.image || ''} alt="Pronta Entrega" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" referrerPolicy="no-referrer" />
                  <div className="absolute inset-0 bg-gradient-to-r from-gold/90 via-gold/50 to-transparent flex items-center p-6">
                    <div>
                      <h3 className="text-primary font-headline font-black text-lg md:text-xl leading-tight uppercase tracking-wide">Pronta<br/>Entrega</h3>
                      <p className="text-primary/70 font-body text-[11px] mt-1.5 font-bold">Para agora!</p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* ── Destaques da Semana ── */}
            {(() => {
              const topSellers = [1, 2, 3]
                .map(pos => PRODUCTS.find(p => p.topSeller === pos))
                .filter(Boolean) as typeof PRODUCTS;

              if (topSellers.length === 0) return null;

              return (
                <section className="space-y-4 -mt-3">
                  {/* Título — mesmo padrão das outras categorias */}
                  <div className="px-6 md:px-10 flex justify-between items-end">
                    <div>
                      <h3 className="font-headline font-extrabold text-lg md:text-xl text-black tracking-tight flex items-center gap-2">
                        Mais pedidos da semana <span className="text-xl">🔥</span>
                      </h3>
                    </div>
                  </div>

                  {/* Cards — scroll mobile, grid desktop */}
                  <div className="flex gap-4 overflow-x-auto md:overflow-visible scrollbar-hide snap-x px-6 md:px-10 scroll-px-6 md:scroll-px-10 pb-4 pt-1 md:grid md:grid-cols-3 md:gap-6 md:pb-0">
                    {topSellers.map((product) => renderProductCard(product, true))}
                  </div>
                </section>
              );
            })()}

            {/* Produtos por categoria */}
            {CATEGORIES.map((category) => {
              const products = PRODUCTS.filter(p => p.category === category.name);
              if (products.length === 0) return null;

              return (
                <section key={category.name} className="space-y-4 pt-4">
                  <div className="flex justify-between items-end px-6 md:px-10">
                    <h3 className="font-headline font-bold text-lg md:text-xl text-black tracking-tight">{category.name}</h3>
                    <button
                      onClick={() => { onSetCategory(category.name); onNavigate('product-list'); }}
                      className="text-black/50 hover:text-primary py-0.5 font-headline font-bold text-[12px] transition-colors flex items-center gap-1"
                    >
                      Ver tudo
                    </button>
                  </div>

                  {/* Mobile: scroll horizontal | Desktop: grid */}
                  <div className="flex gap-4 overflow-x-auto md:overflow-visible pb-4 pt-1 md:pb-0 scrollbar-hide snap-x px-6 md:px-10 scroll-px-6 md:scroll-px-10 md:grid md:grid-cols-3 lg:grid-cols-4 md:gap-6">
                    {products.map((product) => renderProductCard(product))}
                  </div>
                </section>
              );
            })}
            </>
            )}
          </div>
        </div>
      </main>
    </motion.div>
  );
};
