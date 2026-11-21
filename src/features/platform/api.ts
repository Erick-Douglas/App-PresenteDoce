import { request } from '../products/catalogApi';
import { activeStoreId } from '../products/storeContext';
import type { OrderPayload, Snapshot } from './types';
export const snapshot = (token: string, signal?: AbortSignal) =>
  request<Snapshot>(
    '/rest/v1/rpc/operations_snapshot',
    { method: 'POST', body: '{}', signal },
    token,
  );
export async function storeAction<T = unknown>(
  action: string,
  payload: unknown,
  token?: string,
): Promise<T> {
  const value = await request<T | { error: string }>(
    '/functions/v1/store-api',
    {
      method: 'POST',
      body: JSON.stringify({ store_id: activeStoreId(), action, payload }),
    },
    token,
  );
  if (value && typeof value === 'object' && 'error' in value)
    throw Error(String(value.error));
  return value as T;
}
export const checkout = (payload: OrderPayload) =>
  storeAction<{
    order: { id: string; reference: number; total_cents: number };
    message: string;
    whatsapp_url: string;
  }>('checkout', payload);
export function today(timezone = 'Europe/Lisbon') {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}
export function downloadJson(name: string, data: unknown) {
  const url = URL.createObjectURL(
    new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }),
  );
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
