import React from 'react';
import { Menu, ChevronRight } from 'lucide-react';
import { CATEGORIES } from '../constants';
import { View, CartItem } from '../types';
import { motion } from 'framer-motion';

interface CategoriesScreenProps {
  cart: CartItem[];
  cartTotal: number;
  activeCategory: string;
  onSetCategory: (category: string) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export const CategoriesScreen: React.FC<CategoriesScreenProps> = ({ onOpenMenu, onNavigate, activeCategory, onSetCategory }) => {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="min-h-screen pb-24 bg-white">
      <header className="px-6 py-4 flex items-center sticky top-0 bg-white/95 backdrop-blur-sm z-50 border-b border-primary/5 shadow-sm">
        <button onClick={onOpenMenu} className="p-2 -ml-2 text-primary">
          <Menu size={20} />
        </button>
        <h1 className="font-headline font-black text-sm text-primary flex-1 text-center pr-8 tracking-widest uppercase">Categorias</h1>
      </header>

      <main className="px-6 py-8 space-y-6 max-w-2xl mx-auto">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.name}
            className={`flex items-center gap-6 p-4 bg-white rounded-xl shadow-sm cursor-pointer hover:scale-[1.02] transition-transform active:scale-95 border ${activeCategory === cat.name ? 'border-primary shadow-md' : 'border-primary/5'}`}
            onClick={() => {
              onSetCategory(cat.name);
              onNavigate('product-list');
            }}
          >
            <div className="w-24 h-24 rounded-full overflow-hidden shadow-md border-2 border-gold/20">
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover rounded-full" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1">
              <h3 className="font-headline font-bold text-2xl text-primary">{cat.name}</h3>
              <p className="font-body text-on-surface-variant italic">Confira nossa seleção de {cat.name.toLowerCase()}</p>
            </div>
            <ChevronRight size={24} className="text-primary" />
          </div>
        ))}
      </main>
    </motion.div>
  );
};
