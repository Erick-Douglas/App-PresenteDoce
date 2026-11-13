import { ArrowUpRight, Check, Plus } from 'lucide-react';
import type { Product } from '../config/types';
import { currencySymbol } from '../features/checkout/order';
import { formatCatalogPrice } from '../features/products/catalogFields';
import { ProductEditButton } from './ProductEditButton';

interface CatalogCardProps {
  product: Product;
  inCart: boolean;
  onOpen: (product: Product) => void;
  onCart: (product: Product) => void;
  onEdit?: (id: string) => void;
}

export function CatalogCard({ product, inCart, onOpen, onCart, onEdit }: CatalogCardProps) {
  const needsOptions = product.configuravel && !inCart;
  const CartIcon = needsOptions ? ArrowUpRight : inCart ? Check : Plus;
  const cartAction = needsOptions ? 'Personalizar ' : inCart ? 'Retirar do carrinho ' : 'Adicionar ao carrinho ';

  return (
    <article className="ui-card group relative flex min-w-0 flex-col overflow-hidden transition-shadow hover:shadow-md">
      <h3 className="type-label">
        <button type="button" onClick={() => onOpen(product)}
          className="block w-full break-words text-left hover:text-primary focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary">
          <span className="block aspect-[4/3] w-full overflow-hidden bg-muted-fill">
            <img src={product.image} alt="" loading="lazy" decoding="async"
              className="h-full w-full object-cover transition-transform duration-300 motion-safe:group-hover:scale-[1.03]" referrerPolicy="no-referrer" />
          </span>
          <span className="block px-3 pt-3 sm:px-4">{product.name}</span>
        </button>
      </h3>
      <div className="flex-1 px-3 sm:px-4"><p className="mt-1 line-clamp-2 text-xs text-muted">{product.description}</p></div>
      <div className="flex min-h-13 items-center justify-between gap-1 px-3 sm:px-4">
        <span className="type-price leading-tight text-primary">
          {product.configuravel && <span className="block text-xs font-normal text-muted">A partir de</span>}
          <span className="whitespace-nowrap text-base">{currencySymbol}{formatCatalogPrice(product.price)}</span>
        </span>
        <button type="button" onClick={() => onCart(product)} aria-label={cartAction + product.name}
          className="ui-icon-action -mr-1.5" data-active={inCart}>
          <CartIcon size={16} strokeWidth={1.7} aria-hidden="true" />
        </button>
      </div>
      {onEdit && <div className="border-t border-muted-fill px-3 sm:px-4"><ProductEditButton product={product} onEdit={onEdit} /></div>}
    </article>
  );
}
