import { useEffect, useState } from 'react';
import { PRODUCTS } from './data';
import { catalogEnabled, listCatalog, listCatalogCategories, toProduct, type CatalogRow } from './catalogApi';
import { CATEGORIES } from '../../config/constants';
import type { CatalogCategory, Product } from '../../config/types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(catalogEnabled ? [] : PRODUCTS);
  const [categoryNames, setCategoryNames] = useState(() => CATEGORIES.map(category => category.name));
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
      if (!controller.signal.aborted) setCategoryNames(rows.map(row => row.name));
    }).catch(() => {
      // Keep the last known categories and derive any missing names from products.
    });
    return () => controller.abort();
  }, [categoryAttempt]);

  const firstProductImages = new Map<string, string>();
  for (const product of products) {
    if (product.image && !firstProductImages.has(product.category)) firstProductImages.set(product.category, product.image);
  }
  const categories: CatalogCategory[] = [...new Set([...categoryNames, ...firstProductImages.keys()])].map(name => ({
    name,
    image: CATEGORIES.find(category => category.name === name)?.image ?? firstProductImages.get(name),
  }));

  function applyCategory(name: string) {
    setCategoryNames(current => current.includes(name) ? current : [...current, name]);
    setCategoryAttempt(value => value + 1);
  }

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
    products, categories, status, applyChange, applyCategory,
    reload: () => {
      setAttempt(value => value + 1);
      setCategoryAttempt(value => value + 1);
    },
  };
}
