import { calculatePricing, parseDecimal } from './calculation.ts';

export type PricingRecipe = {
  title: string; yieldCount: string; salePrice: string; variant?: string;
  ingredients: { name: string; unit: string; packQuantity: string; packPrice: string; usedQuantity: string }[];
};

export function validatePricingRecipe(recipe: PricingRecipe) {
  if (!recipe || typeof recipe.title !== 'string' || recipe.title.trim().length > 100 ||
      !Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1 || recipe.ingredients.length > 70) {
    throw new Error('Confira os dados da ficha e adicione entre 1 e 70 custos.');
  }
  if (recipe.ingredients.some(row => !row || typeof row.name !== 'string' || !row.name.trim() ||
      row.name.trim().length > 100 || !['g', 'ml', 'un'].includes(row.unit))) {
    throw new Error('Dê um nome e uma unidade válida a cada ingrediente ou despesa.');
  }
  const number = (value: unknown) => typeof value === 'string' ? parseDecimal(value) : NaN;
  return calculatePricing(recipe.ingredients.map(row => ({
    packQuantity: number(row.packQuantity), packPrice: number(row.packPrice), usedQuantity: number(row.usedQuantity),
  })), number(recipe.yieldCount), number(recipe.salePrice));
}
