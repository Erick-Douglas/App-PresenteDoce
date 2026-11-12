import type { CatalogCategory } from '../config/types';

export function CategoryCover({ category, className = '' }: { category: CatalogCategory; className?: string }) {
  const shape = 'size-full rounded-full ' + className;
  if (category.image) {
    return <img src={category.image} alt="" width={72} height={72} decoding="async" className={shape + ' object-cover'} />;
  }
  return (
    <span aria-hidden="true" className={shape + ' type-section grid place-items-center bg-cream text-primary'}>
      {Array.from(category.name.toLocaleUpperCase('pt-PT'))[0]}
    </span>
  );
}
