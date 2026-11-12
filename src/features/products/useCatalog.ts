import { useEffect, useMemo, useState } from 'react';
import { PRODUCTS } from './data';
import { catalogEnabled, listCatalog, listCatalogCategories, toProduct, type CatalogRow, type CategoryRow } from './catalogApi';
import { CATEGORIES } from '../../config/constants';
import type { CatalogCategory, Product } from '../../config/types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(catalogEnabled ? [] : PRODUCTS);
  const [categoryRows, setCategoryRows] = useState<CategoryRow[] | null>(null);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(catalogEnabled ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);
  const [categoryAttempt, setCategoryAttempt] = useState(0);

  useEffect(() => {
    if (!catalogEnabled) return;
    const controller = new AbortController();
    setStatus('loading');
    listCatalog(undefined, controller.signal).then(rows => {
      if (controller.signal.aborted) return;
      setProducts(rows.map(toProduct));
      setStatus('ready');
    }).catch(() => {
      if (controller.signal.aborted) return;
      setStatus('error');
    });
    return () => controller.abort();
  }, [attempt]);

  useEffect(() => {
    if (!catalogEnabled) return;
    const controller = new AbortController();
    listCatalogCategories(controller.signal).then(rows => {
      if (!controller.signal.aborted) setCategoryRows(rows);
    }).catch(() => {
      // Keep the last known categories and derive any missing names from products.
    });
    return () => controller.abort();
  }, [categoryAttempt]);

  const categories = useMemo<CatalogCategory[]>(() => {
    if (!categoryRows) return CATEGORIES;
    const firstProductImages = new Map<string, string>();
    for (const product of products) {
      if (product.image && !firstProductImages.has(product.category)) firstProductImages.set(product.category, product.image);
    }
    return categoryRows.map(row => ({
      id: row.id, name: row.name, image: row.cover ?? firstProductImages.get(row.name), orderMode: row.order_mode,
    }));
  }, [products, categoryRows]);
  const orderedProducts = useMemo(() => {
    const positions = new Map(categories.map((category, index) => [category.name, index]));
    return [...products].sort((a, b) =>
      (positions.get(a.category) ?? categories.length) - (positions.get(b.category) ?? categories.length));
  }, [products, categories]);

  function applyChange(id: string, row: CatalogRow | null) {
    const updated = row?.published ? toProduct(row) : null;
    setProducts(current => {
      if (!updated) return current.filter(product => product.id !== id);
      if (!current.some(product => product.id === id)) return [...current, updated];
      return current.map(product => product.id === id ? updated : product);
    });
    setAttempt(value => value + 1);
  }

  return {
    products: orderedProducts, categories, status, applyChange,
    reload: () => {
      setAttempt(value => value + 1);
      setCategoryAttempt(value => value + 1);
    },
  };
}
