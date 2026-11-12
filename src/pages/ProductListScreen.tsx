import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { CatalogCard } from '../components/CatalogCard';
import type { CartItem, CatalogCategory, Product } from '../config/types';

interface ProductListScreenProps {
  products: Product[];
  categories: CatalogCategory[];
  cart: CartItem[];
  favorites: string[];
  activeRecCategory: string;
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
  onOpenMenu: () => void;
}

export function ProductListScreen({
  products: catalogProducts, categories, cart, favorites, activeRecCategory,
  onSetCategory, onProductClick, onEditProduct, onToggleFavorite, onToggleCartItem, onOpenMenu,
}: ProductListScreenProps) {
  const products = activeRecCategory === 'all' ? catalogProducts : catalogProducts.filter(product => product.category === activeRecCategory);
  const tabsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = tabsRef.current;
    const activeTab = container?.querySelector('[aria-pressed="true"]');
    if (!container || !activeTab) return;
    const offset = activeTab.getBoundingClientRect().left - container.getBoundingClientRect().left;
    container.scrollLeft += offset - (container.clientWidth - activeTab.clientWidth) / 2;
  }, [activeRecCategory, categories.length]);

  const filters = [{ id: 'all', label: 'Todos' }, ...categories.map(category => ({ id: category.name, label: category.name }))];
  const title = activeRecCategory === 'all' ? 'Catálogo' : activeRecCategory;

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-porcelain/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2 sm:px-6">
          <div className="flex min-h-12 items-center gap-2.5">
            <button type="button" onClick={onOpenMenu} aria-label="Abrir menu"
              className="grid size-11 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
              <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
            </button>
            <h1 className="font-editorial text-3xl leading-none text-primary sm:text-4xl">{title}</h1>
          </div>
          <div ref={tabsRef} role="group" aria-label="Filtrar por categoria" className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto py-1">
            {filters.map(({ id, label }) => {
              const selected = activeRecCategory === id;
              return (
                <button key={id} type="button" aria-pressed={selected} onClick={() => onSetCategory(id)}
                  className={'min-h-11 shrink-0 rounded-full border px-3 text-sm font-semibold focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary ' +
                    (selected ? 'border-primary bg-primary text-white focus-visible:outline-white' : 'border-stone-200 bg-white text-stone-700 hover:border-primary/35')}>
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-5 sm:px-6">
        {activeRecCategory === 'Bolos Temáticos' && (
          <p className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-stone-700">
            Encomende bolos temáticos com pelo menos <strong>48 horas de antecedência</strong>. Para prazos mais curtos, fale com a confeitaria pelo WhatsApp.
          </p>
        )}
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-stone-600">Ainda não há produtos nesta categoria.</p>
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {products.map(product => (
              <CatalogCard key={product.id} product={product} inCart={!product.configuravel && cart.some(item => item.id === product.id)}
                favorite={favorites.includes(product.id)} onOpen={onProductClick} onFavorite={onToggleFavorite}
                onCart={product.configuravel ? onProductClick : onToggleCartItem} onEdit={onEditProduct} />
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}
