import { motion } from 'framer-motion';
import { Menu } from 'lucide-react';
import { CatalogGrid } from '../components/CatalogGrid';
import type { CartItem, Product, View } from '../config/types';

interface SavedScreenProps {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  onProductClick: (product: Product) => void;
  onToggleCartItem: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onOpenMenu: () => void;
  onNavigate: (view: View) => void;
}

export function SavedScreen({
  products, cart, favorites, onProductClick, onToggleCartItem, onEditProduct, onOpenMenu, onNavigate,
}: SavedScreenProps) {
  const saved = products.filter(product => favorites.includes(product.id));

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <header className="sticky top-[env(safe-area-inset-top)] z-50 border-b border-outline bg-porcelain/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center gap-2.5 px-4 py-3 sm:px-6">
          <button type="button" aria-label="Abrir menu" onClick={onOpenMenu}
            className="ui-icon-action">
            <Menu size={21} strokeWidth={1.6} aria-hidden="true" />
          </button>
          <h1 className="type-module text-primary">Favoritos</h1>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pt-5 sm:px-6">
        {saved.length ? (
          <CatalogGrid products={saved} cart={cart} onProductClick={onProductClick}
            onToggleCartItem={onToggleCartItem} onEditProduct={onEditProduct} />
        ) : (
          <div className="space-y-2 py-12 text-center text-sm text-muted">
            <p>Você ainda não guardou produtos.</p>
            <button type="button" onClick={() => onNavigate('home')} className="ui-quiet-action">Explorar produtos</button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
