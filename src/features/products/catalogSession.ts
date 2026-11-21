import type { CatalogSession } from './catalogApi';
import { activeStoreId, pilotStoreId } from './storeContext.ts';

export const sessionStorageKey = 'presente-doce:catalog-session:v1';
export const currentSessionStorageKey = () =>
  activeStoreId() === pilotStoreId
    ? sessionStorageKey
    : sessionStorageKey + ':' + activeStoreId();

export function readCatalogSession(): CatalogSession | null {
  for (const kind of ['localStorage', 'sessionStorage'] as const) {
    try {
      const storage = window[kind];
      const raw = storage.getItem(currentSessionStorageKey());
      if (!raw) continue;
      const value = JSON.parse(raw);
      if (
        typeof value.token === 'string' &&
        typeof value.refreshToken === 'string' &&
        value.refreshToken &&
        Number.isFinite(value.expiresAt)
      )
        return value;
      storage.removeItem(currentSessionStorageKey());
    } catch {
      /* A blocked storage must not prevent login. */
    }
  }
  return null;
}

export function writeCatalogSession(value: CatalogSession | null) {
  let saved = false;
  for (const persistent of [true, false]) {
    try {
      const storage = persistent ? window.localStorage : window.sessionStorage;
      storage.removeItem(currentSessionStorageKey());
      if (value && !!value.persistent === persistent) {
        storage.setItem(currentSessionStorageKey(), JSON.stringify(value));
        saved = true;
      }
    } catch {
      /* The active session remains usable in memory. */
    }
  }
  return saved;
}
