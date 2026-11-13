import { SquarePen } from 'lucide-react';
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
        ? 'ui-icon-action absolute top-0 right-0'
        : 'ui-icon-action'}>
      <SquarePen size={15} strokeWidth={1.65} aria-hidden="true" />
    </button>
  );
}
