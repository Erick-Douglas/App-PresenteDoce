import { useCallback, useEffect, useRef, useState } from 'react';
import { AuthRateLimitError } from './authRateLimit';
import {
  refreshCatalogSession,
  signOut,
  type CatalogSession,
} from './catalogApi';
import {
  currentSessionStorageKey,
  readCatalogSession,
  writeCatalogSession,
} from './catalogSession';

let refreshInFlight: Promise<CatalogSession> | null = null;
async function renew(saved: CatalogSession) {
  const perform = async () => {
    const latest = readCatalogSession();
    if (
      latest &&
      latest.refreshToken !== saved.refreshToken &&
      latest.expiresAt > Date.now() + 60000
    )
      return latest;
    const next = {
      ...(await refreshCatalogSession(latest ?? saved)),
      persistent: saved.persistent,
    };
    if (readCatalogSession()?.refreshToken === (latest ?? saved).refreshToken)
      writeCatalogSession(next);
    return next;
  };
  refreshInFlight ??= (
    navigator.locks
      ? navigator.locks.request(
          'presente-doce-session:' + currentSessionStorageKey(),
          perform,
        )
      : perform()
  ).finally(() => {
    refreshInFlight = null;
  });
  return refreshInFlight;
}

export function useCatalogSession() {
  const [session, setSession] = useState<CatalogSession | null>(null);
  const [restoring, setRestoring] = useState(true);
  const [error, setError] = useState('');
  const current = useRef<CatalogSession | null>(null);
  const generation = useRef(0);
  const retryAt = useRef(0);

  const restore = useCallback(async () => {
    const saved = current.current ?? readCatalogSession();
    if (!saved) {
      setRestoring(false);
      return;
    }
    if (Date.now() < retryAt.current) return;
    const expected = generation.current;
    try {
      const next = await renew(saved);
      if (expected !== generation.current) return;
      current.current = next;
      setSession(next);
      setError('');
      retryAt.current = 0;
    } catch (cause) {
      if (expected !== generation.current) return;
      if (cause instanceof Error && cause.message.startsWith('Sessão')) {
        writeCatalogSession(null);
        current.current = null;
        setSession(null);
        setError('A sessão terminou. Entre novamente.');
      } else {
        retryAt.current =
          Date.now() +
          (cause instanceof AuthRateLimitError
            ? cause.retryAfter * 1000
            : 30000);
        setError(
          'Não foi possível renovar o acesso. Verifique a ligação e tente novamente.',
        );
      }
    } finally {
      if (expected === generation.current) setRestoring(false);
    }
  }, []);

  useEffect(() => {
    void restore();
    const onStorage = (event: StorageEvent) => {
      if (event.key !== currentSessionStorageKey() && event.key !== null)
        return;
      if (!readCatalogSession()) {
        generation.current++;
        current.current = null;
        setSession(null);
        setRestoring(false);
      } else void restore();
    };
    const onWake = () => {
      if (
        document.visibilityState === 'visible' &&
        (!current.current || current.current.expiresAt < Date.now() + 90000)
      )
        void restore();
    };
    const interval = window.setInterval(onWake, 30000);
    window.addEventListener('storage', onStorage);
    window.addEventListener('online', onWake);
    document.addEventListener('visibilitychange', onWake);
    return () => {
      generation.current++;
      window.clearInterval(interval);
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('online', onWake);
      document.removeEventListener('visibilitychange', onWake);
    };
  }, [restore]);

  function accept(next: CatalogSession) {
    generation.current++;
    const value = { ...next, persistent: next.persistent !== false };
    current.current = value;
    setSession(value);
    writeCatalogSession(value);
    setError('');
    setRestoring(false);
  }

  function logout() {
    generation.current++;
    const previous = current.current;
    current.current = null;
    setSession(null);
    writeCatalogSession(null);
    if (previous) void signOut(previous.token).catch(() => {});
    setError('');
  }

  return {
    session,
    restoring,
    error,
    retry: () => {
      retryAt.current = 0;
      void restore();
    },
    accept,
    logout,
  };
}
