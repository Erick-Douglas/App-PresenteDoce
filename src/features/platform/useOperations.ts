import { useCallback, useEffect, useRef, useState } from 'react';
import { snapshot } from './api';
import type { Snapshot } from './types';
export function useOperations(token?: string) {
  const [saved, setSaved] = useState<{ token: string; data: Snapshot } | null>(
    null,
  );
  const [failure, setFailure] = useState<{
    token: string;
    message: string;
  } | null>(null);
  const [loading, setLoading] = useState(false);
  const current = useRef(token);
  current.current = token;
  const pending = useRef<{
    token: string;
    promise: Promise<void>;
    controller: AbortController;
  } | null>(null);
  const reload = useCallback(async () => {
    if (!token) {
      setSaved(null);
      setFailure(null);
      setLoading(false);
      return;
    }
    if (
      pending.current?.token === token &&
      !pending.current.controller.signal.aborted
    )
      return pending.current.promise;
    pending.current?.controller.abort();
    const controller = new AbortController();
    setLoading(true);
    const timeout = window.setTimeout(() => controller.abort(), 30000);
    const promise = (async () => {
      try {
        const data = await snapshot(token, controller.signal);
        if (current.current === token && !controller.signal.aborted) {
          setSaved({ token, data });
          setFailure(null);
        }
      } catch (e) {
        if (
          current.current === token &&
          pending.current?.controller === controller
        )
          setFailure({
            token,
            message:
              e instanceof Error
                ? e.message
                : 'Não foi possível atualizar a gestão.',
          });
      } finally {
        clearTimeout(timeout);
        const latest = pending.current?.controller === controller;
        if (latest) pending.current = null;
        if (latest && current.current === token) setLoading(false);
      }
    })();
    pending.current = { token, promise, controller };
    return promise;
  }, [token]);
  useEffect(() => {
    void reload();
    const wake = () => {
      if (document.visibilityState === 'visible') void reload();
    };
    const interval = window.setInterval(wake, 60000);
    window.addEventListener('online', wake);
    document.addEventListener('visibilitychange', wake);
    return () => {
      clearInterval(interval);
      window.removeEventListener('online', wake);
      document.removeEventListener('visibilitychange', wake);
      if (pending.current && pending.current.token === token) pending.current.controller.abort();
    };
  }, [reload, token]);
  return {
    data: saved && saved.token === token ? saved.data : null,
    error: failure && failure.token === token ? failure.message : '',
    loading,
    reload,
  };
}
