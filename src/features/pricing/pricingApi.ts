import { request, saveProduct, type CatalogRow } from '../products/catalogApi';
import { parseCatalogPrice } from '../products/catalogFields';

export type PricingRecipe = {
  title: string;
  yieldCount: string;
  salePrice: string;
  variant?: string;
  ingredients: { name: string; unit: string; packQuantity: string; packPrice: string; usedQuantity: string }[];
};
export type PricingRow = { id: string; product_id: string | null; recipe: PricingRecipe; version: number };

export function listPricingRecipes(token: string, signal?: AbortSignal) {
  return request<PricingRow[]>('/rest/v1/pricing_recipes?select=id,product_id,recipe,version&order=updated_at.desc', { signal }, token);
}

export async function savePricingRecipe(row: Omit<PricingRow, 'version'>, version: number | null, token: string) {
  const editing = version !== null;
  const path = '/rest/v1/pricing_recipes' + (editing ? '?id=eq.' + row.id + '&version=eq.' + version : '');
  const [saved] = await request<PricingRow[]>(path, {
    method: editing ? 'PATCH' : 'POST', headers: { Prefer: 'return=representation' },
    body: JSON.stringify(editing ? { product_id: row.product_id, recipe: row.recipe } : row),
  }, token);
  if (!saved) throw new Error('Esta ficha foi alterada. Reabra a versão guardada antes de continuar.');
  return saved;
}

export function applyProductPrice(row: CatalogRow, priceText: string, variant: string, token: string) {
  const price = parseCatalogPrice(priceText);
  if (price === null || (row.published && price <= 0)) throw new Error('Indique um preço válido com duas casas decimais.');
  const variants = row.details.variants;
  if (row.details.configuravel && !variants?.length) throw new Error('Crie primeiro as opções de preço deste produto no catálogo.');
  if (variants?.length && !variants.some(option => option.label === variant)) throw new Error('Selecione o tamanho ou opção cujo preço quer atualizar.');
  const nextVariants = variants?.map(option => option.label === variant ? { ...option, price } : option);
  const details = { ...row.details, price: nextVariants?.length ? Math.min(...nextVariants.map(option => option.price)) : price };
  if (nextVariants) details.variants = nextVariants;
  return saveProduct({ id: row.id, details, published: row.published }, row.version, token);
}
