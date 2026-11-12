import { Pencil } from 'lucide-react';
import type { CatalogCategory } from '../config/types';

export function CategoryEditButton({ category, onEdit, compact = false }: {
  category: CatalogCategory;
  onEdit?: (id: string) => void;
  compact?: boolean;
}) {
  const { id, name } = category;
  if (!id || !onEdit) return null;
  return (
    <button type="button" aria-label={'Editar categoria ' + name} onClick={() => onEdit(id)}
      className={compact
        ? 'absolute top-0 right-0 grid size-9 place-items-center rounded-full border border-primary/15 bg-porcelain text-primary shadow-sm hover:bg-cream focus-visible:outline-2 focus-visible:outline-primary'
        : 'grid size-11 shrink-0 place-items-center rounded-xl border border-primary/15 bg-porcelain text-primary hover:bg-cream focus-visible:outline-2 focus-visible:outline-primary'}>
      <Pencil size={compact ? 15 : 18} aria-hidden="true" />
    </button>
  );
}
