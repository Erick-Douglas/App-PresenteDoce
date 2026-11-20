import type { CatalogSession } from './catalogApi';

export const sessionStorageKey = 'presente-doce:catalog-session:v1';

export function readCatalogSession(): CatalogSession | null {
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[kind];
      const raw = storage.getItem(sessionStorageKey);
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (typeof value.token === 'string' && typeof value.refreshToken === 'string' &&
          value.refreshToken && Number.isFinite(value.expiresAt)) return value;
      storage.removeItem(sessionStorageKey);
    } catch { /* A blocked storage must not prevent login. */ }
  }
  return null;
}

export function writeCatalogSession(value: CatalogSession | null) {
  let saved = false;
  for (const persistent of [true, false]) {
    try {
      const storage = persistent ? window.localStorage : window.sessionStorage;
      storage.removeItem(sessionStorageKey);
      if (value && !!value.persistent === persistent) {
        storage.setItem(sessionStorageKey, JSON.stringify(value));
        saved = true;
      }
    } catch { /* The active session remains usable in memory. */ }
  }
  return saved;
}
