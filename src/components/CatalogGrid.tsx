import type { CartItem, Product } from '../config/types';
import { CatalogCard } from './CatalogCard';

export interface CatalogActions {
  cart: CartItem[];
  onProductClick: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
}

export function CatalogGrid({ products, cart, onProductClick, onEditProduct, onToggleCartItem }: CatalogActions & { products: Product[] }) {
  return <div className="catalog-grid">
    {products.map(product => <CatalogCard key={product.id} product={product}
      inCart={!product.configuravel && cart.some(item => item.id === product.id)}
      onOpen={onProductClick}
      onCart={product.configuravel ? onProductClick : onToggleCartItem} onEdit={onEditProduct} />)}
  </div>;
}
