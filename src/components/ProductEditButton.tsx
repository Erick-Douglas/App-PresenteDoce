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
      className="my-1 inline-flex min-h-11 w-fit items-center gap-2 rounded-xl border border-primary/20 bg-primary/5 px-3 py-2 text-left text-xs font-bold text-primary hover:bg-primary/10"
    >
      <Pencil size={14} aria-hidden="true" /> Editar produto
    </button>
  );
}
