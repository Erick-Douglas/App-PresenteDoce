import { useEffect, useState } from 'react';
import { listAdminCategories, listCatalog, type AdminCategoryRow, type CatalogRow } from './catalogApi';

type CatalogData = { categories: AdminCategoryRow[]; rows: CatalogRow[] };

export function useAdminCatalog(token?: string) {
  const [snapshot, setSnapshot] = useState<{ token: string; data: CatalogData } | null>(null);
  const [failure, setFailure] = useState<{ token: string; message: string } | null>(null);
  const [attempt, setAttempt] = useState(0);
  const data = snapshot?.token === token ? snapshot?.data : undefined;
  const error = failure?.token === token ? failure?.message : undefined;

  useEffect(() => {
    if (!token) {
      setSnapshot(null);
      setFailure(null);
      return;
    }
    const controller = new AbortController();
    Promise.all([listAdminCategories(token, controller.signal), listCatalog(token, controller.signal)])
      .then(([categories, rows]) => {
        if (!controller.signal.aborted) {
          setSnapshot({ token, data: { categories, rows } });
          setFailure(null);
        }
      })
      .catch(cause => {
        if (!controller.signal.aborted) setFailure({ token, message: cause instanceof Error ? cause.message : 'Não foi possível carregar o catálogo.' });
      });
    return () => controller.abort();
  }, [token, attempt]);

  function reload() {
    setFailure(null);
    setAttempt(value => value + 1);
  }

  function applyCategory(category: AdminCategoryRow) {
    if (!token) return;
    setSnapshot(current => current?.token === token ? {
      token,
      data: {
        rows: current.data.rows,
        categories: current.data.categories.some(item => item.id === category.id)
          ? current.data.categories.map(item => item.id === category.id ? category : item)
          : [...current.data.categories, category],
      },
    } : current);
  }

  return { data, error, reload, applyCategory };
}
