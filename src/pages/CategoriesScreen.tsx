import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import { CategoryCover } from '../components/CategoryCover';
import { CategoryEditButton } from '../components/CategoryEditButton';
import type { CatalogCategory, View } from '../config/types';
import { motion } from 'framer-motion';

interface CategoriesScreenProps {
  categories: CatalogCategory[];
  activeCategory: string;
  onSetCategory: (category: string) => void;
  onEditCategory?: (id: string) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ categories, onOpenMenu, onNavigate, activeCategory, onSetCategory, onEditCategory }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pb-24 bg-surface">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-surface/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary">
          <Menu size={20} />
        </button>
        <h1 className="type-page flex-1 pr-8 text-center text-primary">Categorias</h1>
      </header>

      <main className="px-6 py-8 space-y-4">
        {categories.map((cat) => (
          <div className="flex items-center gap-2" key={cat.id ?? cat.name}>
            <button
              type="button"
              className={`flex w-full min-w-0 items-center gap-4 p-4 text-left bg-surface rounded-xl shadow-sm active:scale-95 transition-transform border ${activeCategory === cat.name ? 'border-primary shadow-md' : 'border-primary/5'}`}
              onClick={() => { onSetCategory(cat.name); onNavigate('product-list'); }}
            >
              <span className="size-16 shrink-0 overflow-hidden rounded-full border-2 border-gold/20 shadow-md">
                <CategoryCover category={cat} />
              </span>
              <span className="type-section min-w-0 flex-1 break-words text-primary">{cat.name}</span>
              <ChevronRight size={20} className="shrink-0 text-primary" aria-hidden="true" />
            </button>
            <CategoryEditButton category={cat} onEdit={onEditCategory} />
          </div>
        ))}
      </main>
    </motion.div>
  );
};
