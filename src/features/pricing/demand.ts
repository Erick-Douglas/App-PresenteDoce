import { parseDecimal } from './calculation.ts';
import type { PricingRecipe } from './recipe.ts';
type RecipeRow = {
  id: string;
  product_id: string | null;
  recipe: PricingRecipe;
};
type Source = {
  id: string;
  name: string;
  unit: string;
  stock_quantity: number;
  pack_quantity: number;
};
type Item = {
  product_id: string;
  option_key: string;
  quantity: number;
  mode: string;
};
export function productionDemand(
  items: Item[],
  recipes: RecipeRow[],
  sources: Source[],
) {
  const totals = new Map<
    string,
    {
      name: string;
      unit: string;
      required: number;
      available: number;
      toBuy: number;
      packages: number | null;
    }
  >();
  const missing: string[] = [];
  function walk(recipe: PricingRecipe, factor: number, path: string[]) {
    const yieldCount = parseDecimal(recipe.yieldCount);
    if (!Number.isFinite(yieldCount) || yieldCount <= 0 || path.length > 20)
      throw Error('Confira rendimento e dependências das fichas.');
    for (const row of recipe.ingredients) {
      const used = (parseDecimal(row.usedQuantity) * factor) / yieldCount;
      if (!Number.isFinite(used) || used < 0)
        throw Error('Quantidade inválida numa ficha.');
      if (row.recipeId) {
        if (path.includes(row.recipeId))
          throw Error('Dependência circular em fichas.');
        const child = recipes.find((r) => r.id === row.recipeId);
        if (!child) {
          missing.push(row.name);
          continue;
        }
        walk(child.recipe, used, [...path, row.recipeId]);
        continue;
      }
      const source = sources.find((i) => i.id === row.ingredientId);
      const key = source?.id || row.name.trim().toLowerCase() + '|' + row.unit;
      const prev = totals.get(key),
        required = (prev?.required || 0) + used,
        available = source?.stock_quantity || 0,
        toBuy = Math.max(0, required - available);
      totals.set(key, {
        name: source?.name || row.name,
        unit: source?.unit || row.unit,
        required,
        available,
        toBuy,
        packages: source ? Math.ceil(toBuy / source.pack_quantity) : null,
      });
    }
  }
  for (const item of items.filter((i) => i.mode === 'preorder')) {
    const row = recipes.find(
      (r) =>
        r.product_id === item.product_id &&
        (r.recipe.variant || '') === item.option_key,
    );
    if (!row) {
      missing.push(
        item.product_id + (item.option_key ? ' · ' + item.option_key : ''),
      );
      continue;
    }
    walk(row.recipe, item.quantity, [row.id]);
  }
  return {
    rows: Array.from(totals.values()).sort((a, b) =>
      a.name.localeCompare(b.name),
    ),
    missing: [...new Set(missing)],
  };
}
