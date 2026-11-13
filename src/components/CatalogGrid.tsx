import type { CartItem, Product } from '../config/types';
import { CatalogCard } from './CatalogCard';

export interface CatalogActions {
  cart: CartItem[];
  favorites: string[];
  onProductClick: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
}

export function CatalogGrid({ products, cart, favorites, onProductClick, onEditProduct, onToggleFavorite, onToggleCartItem }: CatalogActions & { products: Product[] }) {
  return <div className="catalog-grid">
    {products.map(product => <CatalogCard key={product.id} product={product}
      inCart={!product.configuravel && cart.some(item => item.id === product.id)}
      favorite={favorites.includes(product.id)} onOpen={onProductClick} onFavorite={onToggleFavorite}
      onCart={product.configuravel ? onProductClick : onToggleCartItem} onEdit={onEditProduct} />)}
  </div>;
}
