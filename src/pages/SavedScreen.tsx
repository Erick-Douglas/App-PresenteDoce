import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { CatalogCard } from '../components/CatalogCard';
import type { CartItem, Product, View } from '../config/types';

interface SavedScreenProps {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  onProductClick: (product: Product) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export function SavedScreen({
  products, cart, favorites, onProductClick, onToggleFavorite, onToggleCartItem, onEditProduct, onOpenMenu, onNavigate,
}: SavedScreenProps) {
  const saved = products.filter(product => favorites.includes(product.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <header className="sticky top-0 z-50 border-b border-stone-200 bg-porcelain/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
            className="grid size-11 place-items-center rounded-full text-primary hover:bg-primary/5 focus-visible:outline-2 focus-visible:outline-primary">
            <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <h1 className="font-editorial text-3xl leading-none text-primary sm:text-4xl">Favoritos</h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {saved.length ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4">
            {saved.map(product => (
              <CatalogCard key={product.id} product={product} inCart={cart.some(item => item.id === product.id)} favorite
                onOpen={onProductClick} onFavorite={onToggleFavorite} onCart={onToggleCartItem} onEdit={onEditProduct} />
            ))}
          </div>
        ) : (
          <div className="space-y-2 py-12 text-center text-sm text-stone-600">
            <p>Você ainda não guardou produtos.</p>
            <button type="button" onClick={() => onNavigate('home')} className="min-h-11 font-semibold text-primary underline">Explorar produtos</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
