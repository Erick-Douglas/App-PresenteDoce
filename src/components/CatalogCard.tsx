import { ArrowUpRight, Check, Heart, Plus } from 'lucide-react';
import type { Product } from '../config/types';
import { formatEuros } from '../features/checkout/order';
import { ProductEditButton } from './ProductEditButton';

interface CatalogCardProps {
  product: Product;
  inCart: boolean;
  favorite: boolean;
  onOpen: (product: Product) => void;
  onFavorite: (id: string) => void;
  onCart: (product: Product) => void;
  onEdit?: (id: string) => void;
}

export function CatalogCard({ product, inCart, favorite, onOpen, onFavorite, onCart, onEdit }: CatalogCardProps) {
  const needsOptions = product.configuravel && !inCart;
  const CartIcon = needsOptions ? ArrowUpRight : inCart ? Check : Plus;
  const cartAction = needsOptions ? 'Personalizar ' : inCart ? 'Retirar do carrinho ' : 'Adicionar ao carrinho ';

  return (
    <article className="ui-card group relative flex min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
      <h3 className="flex-1">
        <button type="button" onClick={() => onOpen(product)}
          className="type-label flex h-full w-full flex-col gap-3 text-left text-on-surface focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
          <span className="block aspect-[4/3] w-full overflow-hidden bg-muted-fill">
            <img src={product.image} alt="" loading="lazy" decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
          </span>
          <span className="px-3 sm:px-4">{product.name}</span>
        </button>
      </h3>
      <button type="button" aria-label={'Favorito: ' + product.name} aria-pressed={favorite} onClick={() => onFavorite(product.id)}
        className="absolute top-2 right-2 grid size-11 place-items-center rounded-full border border-surface/65 bg-surface/95 text-primary focus-visible:outline-2 focus-visible:outline-primary">
        <Heart size={16} strokeWidth={1.7} className={favorite ? 'fill-primary' : ''} aria-hidden="true" />
      </button>
      <div className="flex items-end justify-between gap-1 px-3 pt-2 pb-3 sm:px-4">
        <span className="type-price pb-1 text-primary">
          {product.configuravel && <span className="block text-xs font-bold text-muted">A partir de</span>}
          {formatEuros(product.price)}
        </span>
        <button type="button" onClick={() => onCart(product)} aria-label={cartAction + product.name}
          className={'grid size-11 shrink-0 place-items-center rounded-full border border-primary/15 focus-visible:outline-2 focus-visible:outline-primary ' +
            (inCart ? 'bg-primary text-on-strong' : 'bg-primary/5 text-primary hover:bg-primary/10')}>
          <CartIcon size={18} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
      {onEdit && <div className="border-t border-muted-fill px-3 py-1 sm:px-4"><ProductEditButton product={product} onEdit={onEdit} /></div>}
    </article>
  );
}
