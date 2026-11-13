import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { CatalogGrid } from '../components/CatalogGrid';
import { CategoryEditButton } from '../components/CategoryEditButton';
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
  onEditCategory?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
  onOpenMenu: () => void;
}

export function ProductListScreen({
  products: catalogProducts, categories, cart, favorites, activeRecCategory,
  onSetCategory, onProductClick, onEditProduct, onEditCategory, onToggleFavorite, onToggleCartItem, onOpenMenu,
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
  const currentCategory = categories.find(category => category.name === activeRecCategory);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <header className="sticky top-0 z-50 border-b border-outline bg-porcelain/95 backdrop-blur-md">
        <div className="mx-auto max-w-6xl px-4 pt-3 pb-2 sm:px-6">
          <div className="flex min-h-12 items-center gap-2.5">
            <button type="button" onClick={onOpenMenu} aria-label="Abrir menu"
              className="grid size-11 shrink-0 place-items-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
              <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
            </button>
            <h1 className="type-page min-w-0 flex-1 break-words text-primary">{title}</h1>
            {currentCategory && <CategoryEditButton category={currentCategory} onEdit={onEditCategory} />}
          </div>
          <div ref={tabsRef} role="group" aria-label="Filtrar por categoria" className="category-rail mt-2">
            {filters.map(({ id, label }) => {
              const selected = activeRecCategory === id;
              return (
                <button key={id} type="button" aria-pressed={selected} onClick={() => onSetCategory(id)}
                  className="category-pill">
                  {label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl space-y-4 px-4 pt-5 sm:px-6">
        {(currentCategory?.orderMode === 'cake' || activeRecCategory === 'Bolos Temáticos') && (
          <p className="rounded-xl border border-primary/10 bg-primary/5 px-4 py-3 text-sm leading-relaxed text-on-surface">
            Encomende bolos temáticos com pelo menos <strong>48 horas de antecedência</strong>. Para prazos mais curtos, fale com a confeitaria pelo WhatsApp.
          </p>
        )}
        {products.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted">Ainda não há produtos nesta categoria.</p>
        ) : (
          <CatalogGrid products={products} cart={cart} favorites={favorites} onProductClick={onProductClick}
            onToggleFavorite={onToggleFavorite} onToggleCartItem={onToggleCartItem} onEditProduct={onEditProduct} />
        )}
      </div>
    </motion.div>
  );
}
