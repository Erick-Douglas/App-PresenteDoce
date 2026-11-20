import type { Product, ProductOrderMode } from '../../config/types';
import { readManualRecoveryToken } from './adminLink';
import { AuthRateLimitError, authRetryAfter } from './authRateLimit';
import type { StorePresentation } from './storePresentation';

const configuredUrl = String(import.meta.env.VITE_CATALOG_SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? '').trim();
const publicKey = String(import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
const serviceUrl = /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(configuredUrl) ? configuredUrl.replace(/\/$/, '') : '';
export const catalogEnabled = import.meta.env.VITE_CATALOG_SOURCE === 'supabase';
export const catalogConfigured = catalogEnabled && !!(serviceUrl && publicKey.startsWith('sb_publishable_'));

const productsPath = '/rest/v1/catalog_products';
const categoriesPath = '/rest/v1/catalog_categories';
const bucketPath = '/storage/v1/object/catalog-images/';

export interface CatalogRow {
  id: string;
  details: Omit<Product, 'id'>;
  published: boolean;
  version: number;
}

export interface CatalogTopic {
  id: string;
  name: string;
}

export interface CategoryRow {
  id: string;
  name: string;
  cover: string | null;
  order_mode: ProductOrderMode;
}

export interface AdminCategoryRow extends CategoryRow {
  revision: number;
  topics: CatalogTopic[];
}

const categoryColumns = 'id,name,cover,order_mode';
const categoryConflict = 'O catálogo mudou entretanto. Reabra a categoria para obter a versão atual.';

export async function request<T>(path: string, options: RequestInit = {}, token?: string, conflictMessage?: string): Promise<T> {
  if (!catalogConfigured) throw new Error('O ambiente do catálogo ainda precisa de configuração.');
  const headers = new Headers(options.headers);
  headers.set('apikey', publicKey);
  if (token) headers.set('Authorization', 'Bearer ' + token);
  if (typeof options.body === 'string') headers.set('Content-Type', 'application/json');
  const response = await fetch(serviceUrl + path, { ...options, headers, signal: options.signal ?? AbortSignal.timeout(30000), cache: 'no-store' }).catch(() => { throw new Error('A ligação demorou demasiado ou foi interrompida. Os dados do formulário foram preservados. Tente novamente.'); });
  if (!response.ok) {
    if (response.status === 401 || (response.status === 400 && path.includes('grant_type=refresh_token'))) throw new Error('Sessão ou credenciais inválidas. Confirme o acesso e volte a entrar.');
    if (response.status === 403) throw new Error('A sua conta não tem permissão para esta ação.');
    if (response.status === 409) throw new Error(conflictMessage ?? 'O produto pode já ter sido guardado. Atualize a lista antes de tentar novamente.');
    if (response.status === 429) throw new AuthRateLimitError(authRetryAfter(response.headers.get('retry-after')));
    if (response.status === 413) throw new Error('A fotografia é demasiado grande. Escolha uma imagem menor.');
    const detail = await response.json().catch(() => ({})) as { code?: string; message?: string };
    if (detail.code === '23514') throw new Error('O produto não passou na validação. Confira preço, categoria e fotografia e tente novamente.');
    if (path.startsWith('/storage/')) throw new Error('Não foi possível enviar a fotografia. Verifique a ligação e o acesso da conta e tente novamente.');
    throw new Error('Não foi possível guardar os dados. O formulário foi preservado. Tente novamente.');
  }
  if (response.status === 204 || response.headers.get('content-length') === '0') return undefined as T;
  return response.json() as Promise<T>;
}

export interface CatalogSession {
  token: string;
  expiresAt: number;
  refreshToken?: string;
  persistent?: boolean;
}

function captchaProof(token?: string) {
  return token ? { gotrue_meta_security: { captcha_token: token } } : {};
}

export async function signIn(email: string, password: string, captchaToken?: string): Promise<CatalogSession> {
  const result = await request<{ access_token: string; refresh_token: string; expires_in: number }>('/auth/v1/token?grant_type=password', {
    method: 'POST',
    body: JSON.stringify({ email, password, ...captchaProof(captchaToken) }),
  });
  await assertCatalogAdmin(result.access_token);
  return { token: result.access_token, refreshToken: result.refresh_token, expiresAt: Date.now() + result.expires_in * 1000 };
}

export async function refreshCatalogSession(session: CatalogSession): Promise<CatalogSession> {
  if (!session.refreshToken) throw new Error('Sessão sem renovação disponível.');
  const result = await request<{ access_token: string; refresh_token: string; expires_in: number }>('/auth/v1/token?grant_type=refresh_token', {
    method: 'POST', body: JSON.stringify({ refresh_token: session.refreshToken }),
  });
  try { await assertCatalogAdmin(result.access_token); }
  catch {
    await signOut(result.access_token).catch(() => {});
    throw new Error('Sessão sem permissão administrativa.');
  }
  return { token: result.access_token, refreshToken: result.refresh_token, expiresAt: Date.now() + result.expires_in * 1000 };
}

async function assertCatalogAdmin(token: string) {
  const allowed = await request<boolean>('/rest/v1/rpc/is_catalog_admin', {
    method: 'POST',
    body: '{}',
  }, token);
  if (!allowed) {
    await signOut(token).catch(() => {});
    throw new Error('Esta conta não tem acesso à gestão do catálogo.');
  }
}

export async function redeemManualRecoveryLink(link: string) {
  const tokenHash = readManualRecoveryToken(link, serviceUrl);
  const result = await request<{ access_token: string }>('/auth/v1/verify', {
    method: 'POST',
    body: JSON.stringify({ token_hash: tokenHash, type: 'recovery' }),
  }).catch(() => {
    throw new Error('Este link não pôde ser validado. Use o endereço completo do e-mail mais recente, antes de abrir o link.');
  });
  return result.access_token;
}

export async function requestAdminRecovery(email: string, redirectTo: string, captchaToken?: string) {
  const query = new URLSearchParams({ redirect_to: redirectTo });
  await request('/auth/v1/recover?' + query, { method: 'POST', body: JSON.stringify({ email, ...captchaProof(captchaToken) }) });
}

export async function setAdminPassword(token: string, password: string) {
  await assertCatalogAdmin(token);
  await request('/auth/v1/user', { method: 'PUT', body: JSON.stringify({ password }) }, token);
}

export async function signOut(token: string, scope: 'local' | 'global' = 'local') {
  await request<void>('/auth/v1/logout?scope=' + scope, { method: 'POST' }, token);
}

export function listCatalog(token?: string, signal?: AbortSignal) {
  const query = '?select=id,details,published,version&order=display_order.asc.nullslast,created_at.asc,id.asc' +
    (token ? '' : '&published=eq.true');
  return request<CatalogRow[]>(productsPath + query, { signal }, token);
}

const presentationPath = '/rest/v1/store_presentation';
const presentationFields = 'home_title,home_description,admin_name,about_text,revision';

export async function getStorePresentation(signal?: AbortSignal) {
  const [row] = await request<StorePresentation[]>(presentationPath + '?id=is.true&select=' + presentationFields, { signal });
  if (!row) throw new Error('A apresentação da loja está indisponível.');
  return row;
}

export async function saveStorePresentation({ revision, ...fields }: StorePresentation, token: string) {
  const [row] = await request<StorePresentation[]>(presentationPath + '?id=is.true&revision=eq.' + revision + '&select=' + presentationFields, {
    method: 'PATCH', headers: { Prefer: 'return=representation' }, body: JSON.stringify(fields),
  }, token);
  if (!row) throw new Error('O conteúdo mudou entretanto. Reabra o painel para carregar a versão atual.');
  return row;
}

export function listCatalogCategories(signal?: AbortSignal) {
  return request<CategoryRow[]>(categoriesPath + '?select=' + categoryColumns + '&order=display_order.asc.nullslast,position.asc', { signal });
}

export async function createCatalogCategory(name: string, token: string) {
  const [category] = await request<CategoryRow[]>(categoriesPath + '?select=' + categoryColumns, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({ name }),
  }, token, 'Já existe uma categoria com esse nome. Atualize o catálogo para a selecionar.');
  return { ...category, revision: 1, topics: [] } satisfies AdminCategoryRow;
}

export function listAdminCategories(token: string, signal?: AbortSignal) {
  return request<AdminCategoryRow[]>('/rest/v1/rpc/catalog_category_details', {
    method: 'POST', body: '{}', signal,
  }, token);
}

type OrderChange = { current: string[]; next: string[] };

export function saveCatalogCategory(category: AdminCategoryRow, token: string, products?: OrderChange, categories?: OrderChange) {
  return request<void>('/rest/v1/rpc/save_catalog_category', {
    method: 'POST',
    body: JSON.stringify({
      p_id: category.id, p_revision: category.revision, p_name: category.name, p_topics: category.topics,
      p_product_ids: products?.next, p_expected_product_ids: products?.current,
      p_category_ids: categories?.next, p_expected_category_ids: categories?.current,
    }),
  }, token, categoryConflict);
}

export function deleteCatalogCategory(category: AdminCategoryRow, destination: string | null, token: string) {
  return request<void>('/rest/v1/rpc/delete_catalog_category', {
    method: 'POST', body: JSON.stringify({ p_id: category.id, p_revision: category.revision, p_destination: destination }),
  }, token, categoryConflict);
}

export async function getCatalogProduct(id: string, token: string, signal?: AbortSignal) {
  const rows = await request<CatalogRow[]>(productsPath + '?id=eq.' + encodeURIComponent(id) + '&select=id,details,published,version', { signal }, token);
  if (!rows.length) throw new Error('Este produto já não está disponível para edição.');
  return rows[0];
}

export function imageUrl(value: string) {
  if (!value) return '';
  if (!value.startsWith('catalog/')) return value;
  return serviceUrl + '/storage/v1/object/public/catalog-images/' + value;
}

export function toProduct(row: CatalogRow): Product {
  return { ...row.details, id: row.id, image: imageUrl(row.details.image) };
}

export async function saveProduct(row: Omit<CatalogRow, 'version'>, version: number | null, token: string) {
  const editing = version !== null;
  const filter = editing ? '?id=eq.' + encodeURIComponent(row.id) + '&version=eq.' + version : '';
  const rows = await request<CatalogRow[]>(productsPath + filter, {
    method: editing ? 'PATCH' : 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(editing ? { details: row.details, published: row.published } : row),
  }, token);
  if (!rows?.length) throw new Error('O produto mudou entretanto. Volte à lista e abra a versão mais recente.');
  return rows[0];
}

export async function deleteProduct(row: CatalogRow, token: string) {
  const filter = '?id=eq.' + encodeURIComponent(row.id) + '&version=eq.' + row.version + '&select=id';
  const rows = await request<{ id: string }[]>(productsPath + filter, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' },
  }, token);
  if (rows?.length !== 1) throw new Error('O produto mudou entretanto. Abra a versão mais recente antes de excluir.');
}

export async function uploadProductImage(file: File, token: string) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif'];
  if (!allowedTypes.includes(file.type) && !/\.(jpe?g|png|webp|heic|heif)$/i.test(file.name)) {
    throw new Error('Escolha uma fotografia JPG, PNG, WebP ou HEIC.');
  }
  if (file.size > 20 * 1024 * 1024) throw new Error('A fotografia deve ter até 20 MB.');
  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await createImageBitmap(file);
  } catch {
    const url = URL.createObjectURL(file);
    try {
      const element = new Image();
      element.src = url;
      await element.decode();
      image = element;
    } catch {
      throw new Error('Não foi possível ler esta fotografia. Exporte-a como JPG ou PNG e tente novamente.');
    } finally { URL.revokeObjectURL(url); }
  }
  const width = image instanceof HTMLImageElement ? image.naturalWidth : image.width;
  const height = image instanceof HTMLImageElement ? image.naturalHeight : image.height;
  const scale = Math.min(1, 1600 / Math.max(width, height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.max(1, Math.round(width * scale));
  canvas.height = Math.max(1, Math.round(height * scale));
  try {
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Não foi possível preparar a imagem neste dispositivo.');
    context.drawImage(image, 0, 0, canvas.width, canvas.height);
  } finally { if ('close' in image) image.close(); }
  const encode = (type: string) => new Promise<Blob | null>(resolve => canvas.toBlob(resolve, type, 0.86));
  let blob = await encode('image/webp');
  if (!blob || blob.type !== 'image/webp') blob = await encode('image/jpeg');
  if (!blob || !['image/webp', 'image/jpeg'].includes(blob.type) || blob.size > 5 * 1024 * 1024) {
    throw new Error('Não foi possível preparar a fotografia. Escolha outra imagem.');
  }
  const path = 'catalog/' + crypto.randomUUID() + (blob.type === 'image/webp' ? '.webp' : '.jpg');
  await request(bucketPath + path, { method: 'POST', headers: { 'Content-Type': blob.type }, body: blob }, token);
  return path;
}
