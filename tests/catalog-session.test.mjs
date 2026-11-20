import test from 'node:test';
import assert from 'node:assert/strict';
import { readCatalogSession, writeCatalogSession, sessionStorageKey } from '../src/features/products/catalogSession.ts';

function storage() {
  const data = new Map();
  return { getItem: key => data.get(key) ?? null, setItem: (key, value) => data.set(key, value), removeItem: key => data.delete(key) };
}

test('remembered sessions survive a new read and logout clears both storage types', () => {
  globalThis.window = { localStorage: storage(), sessionStorage: storage() };
  const session = { token: 'access', refreshToken: 'renew', expiresAt: 123456, persistent: true };
  assert.equal(writeCatalogSession(session), true);
  assert.deepEqual(readCatalogSession(), session);
  assert.equal(window.sessionStorage.getItem(sessionStorageKey), null);
  writeCatalogSession(null);
  assert.equal(readCatalogSession(), null);
});

test('temporary access uses session storage and rejects incomplete saved sessions', () => {
  globalThis.window = { localStorage: storage(), sessionStorage: storage() };
  const session = { token: 'access', refreshToken: 'renew', expiresAt: 123456, persistent: false };
  writeCatalogSession(session);
  assert.equal(window.localStorage.getItem(sessionStorageKey), null);
  assert.deepEqual(readCatalogSession(), session);
  window.sessionStorage.setItem(sessionStorageKey, JSON.stringify({ token: 'old', expiresAt: 1 }));
  assert.equal(readCatalogSession(), null);
});

test('blocked storage does not prevent in-memory login or safe logout', () => {
  globalThis.window = { get localStorage() { throw new Error('blocked'); }, get sessionStorage() { throw new Error('blocked'); } };
  assert.equal(readCatalogSession(), null);
  assert.equal(writeCatalogSession(null), false);
});
