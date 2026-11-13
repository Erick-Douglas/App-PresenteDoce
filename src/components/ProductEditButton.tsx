import { Pencil } from 'lucide-react';
import type { Product } from '../config/types';

export function ProductEditButton({ product, onEdit }: {
  product: Product;
  onEdit?: (id: string) => void;
}) {
  if (!onEdit) return null;

  return (
    <button
      type="button"
      aria-label={'Editar produto ' + product.name}
      onClick={event => { event.stopPropagation(); onEdit(product.id); }}
      className="ui-quiet-action text-xs"
    >
      <Pencil size={14} strokeWidth={1.65} aria-hidden="true" /> Editar produto
    </button>
  );
}
