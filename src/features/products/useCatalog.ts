import { useEffect, useState } from 'react';
import { PRODUCTS } from './data';
import { catalogEnabled, listCatalog, toProduct, type CatalogRow } from './catalogApi';
import type { Product } from '../../config/types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(catalogEnabled ? [] : PRODUCTS);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(catalogEnabled ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);

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

  function applyChange(id: string, row: CatalogRow | null) {
    const updated = row?.published ? toProduct(row) : null;
    setProducts(current => {
      if (!updated) return current.filter(product => product.id !== id);
      if (!current.some(product => product.id === id)) return [...current, updated];
      return current.map(product => product.id === id ? updated : product);
    });
    setAttempt(value => value + 1);
  }

  return { products, status, reload: () => setAttempt(value => value + 1), applyChange };
}
