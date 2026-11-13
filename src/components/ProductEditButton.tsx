import { SquarePen } from 'lucide-react';
import type { Product } from '../config/types';

export function ProductEditButton({ product, onEdit }: {
  product: Pick<Product, 'id' | 'name'>;
  onEdit?: (id: string) => void;
}) {
  if (!onEdit) return null;

  return (
    <button
      type="button"
      aria-label={'Editar produto ' + product.name}
      onClick={event => { event.stopPropagation(); onEdit(product.id); }}
      className="ui-edit-action"
    >
      <SquarePen size={14} strokeWidth={1.65} aria-hidden="true" /> Editar
    </button>
  );
}
