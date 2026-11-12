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
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pb-24 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary">
          <Menu size={20} />
        </button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">Categorias</h1>
      </header>

      <main className="px-6 py-8 space-y-4">
        {categories.map((cat) => (
          <div className="flex items-center gap-2" key={cat.id ?? cat.name}>
          <button
            type="button"
            className={`flex w-full items-center gap-5 p-4 text-left bg-white rounded-xl shadow-sm active:scale-95 transition-transform border ${activeCategory === cat.name ? 'border-primary shadow-md' : 'border-primary/5'}`}
            onClick={() => { onSetCategory(cat.name); onNavigate('product-list'); }}
          >
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-md border-2 border-gold/20 shrink-0">
              <CategoryCover category={cat} />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-headline font-bold text-xl text-primary">{cat.name}</h3>
              <p className="font-body text-on-surface-variant text-sm italic truncate">Confira nossa seleção de {cat.name.toLowerCase()}</p>
            </div>
            <ChevronRight size={20} className="text-primary shrink-0" />
          </button>
          <CategoryEditButton category={cat} onEdit={onEditCategory} />
          </div>
        ))}
      </main>
    </motion.div>
  );
};
