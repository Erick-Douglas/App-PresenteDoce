import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { CategoryEditButton } from '../components/CategoryEditButton';
import { CatalogGrid, type CatalogActions } from '../components/CatalogGrid';
import type { CatalogCategory, Product, View } from '../config/types';

interface CategoriesScreenProps extends CatalogActions {
  categories: CatalogCategory[];
  products: Product[];
  onEditCategory?: (id: string) => void;
  onNavigate: (view: View) => void;
}

export function CategoriesScreen({ categories, products, onNavigate, onEditCategory, ...actions }: CategoriesScreenProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <header className="store-masthead">
        <div className="page-width flex min-h-16 items-center gap-3 text-on-primary">
          <button type="button" onClick={() => onNavigate('home')} aria-label="Voltar à vitrine"
            className="grid size-11 shrink-0 place-items-center rounded-full hover:bg-surface/10">
            <ArrowLeft size={21} aria-hidden="true" />
          </button>
          <h1 className="type-page">Todas as categorias</h1>
        </div>
      </header>
      <div className="page-width space-y-7 py-5 sm:py-7">
        {categories.map((category, index) => {
          const items = products.filter(product => product.category === category.name);
          return (
            <section key={category.id ?? category.name} className="space-y-2.5" aria-labelledby={'all-category-' + index}>
              <div className="flex min-h-11 items-center justify-between gap-2">
                <h2 className="type-section break-words" id={'all-category-' + index}>{category.name}</h2>
                <CategoryEditButton category={category} onEdit={onEditCategory} />
              </div>
              {items.length ? <CatalogGrid products={items} {...actions} /> : <p className="text-sm text-muted">Sem produtos publicados.</p>}
            </section>
          );
        })}
        {!categories.length && <p className="text-sm text-muted">Ainda não há categorias.</p>}
      </div>
    </motion.div>
  );
}
