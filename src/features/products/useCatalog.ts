import { useEffect, useState } from 'react';
import { PRODUCTS } from './data';
import { catalogConfigurationPresent, listCatalog, toProduct } from './catalogApi';
import type { Product } from '../../config/types';

export function useCatalog() {
  const [products, setProducts] = useState<Product[]>(catalogConfigurationPresent ? [] : PRODUCTS);
  const [status, setStatus] = useState<'ready' | 'loading' | 'error'>(catalogConfigurationPresent ? 'loading' : 'ready');
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!catalogConfigurationPresent) return;
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

  return { products, status, reload: () => setAttempt(value => value + 1) };
}
