import type { Product, ProductOrderMode } from '../../config/types.ts';

const decimalPrice = new Intl.NumberFormat('pt-PT', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
  useGrouping: false,
});

export function parseCatalogPrice(value: string) {
  const normalized = value.trim().replace(',', '.');
  return /^\d{1,5}(\.\d{1,2})?$/.test(normalized) ? Number(normalized) : null;
}

export function formatCatalogPrice(value: number) {
  return decimalPrice.format(value);
}
export function productOrderMode(product: Pick<Product, 'orderMode' | 'configuravel' | 'category'>): ProductOrderMode {
  if (product.orderMode) return product.orderMode;
  if (!product.configuravel) return 'simple';
  if (product.category === 'Brigadeiros') return 'brigadeiros';
  if (product.category === 'Salgados') return 'salgados';
  return 'cake';
}

export function moveCatalogItem<T>(items: T[], index: number, offset: -1 | 1): T[] {
  const destination = index + offset;
  if (index < 0 || index >= items.length || destination < 0 || destination >= items.length) return items;
  const next = [...items];
  [next[index], next[destination]] = [next[destination], next[index]];
  return next;
}

