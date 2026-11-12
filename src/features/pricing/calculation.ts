export interface IngredientCost {
  packQuantity: number;
  packPrice: number;
  usedQuantity: number;
}

export function calculatePricing(ingredients: IngredientCost[], yieldCount: number, salePrice: number) {
  if (!Number.isFinite(yieldCount) || yieldCount <= 0 || !Number.isFinite(salePrice) || salePrice < 0 || !ingredients.length) {
    throw new Error('Preencha o rendimento, o preço de venda e pelo menos um ingrediente.');
  }
  const lineCosts = ingredients.map(({ packQuantity, packPrice, usedQuantity }) => {
    if (![packQuantity, packPrice, usedQuantity].every(Number.isFinite) || packQuantity <= 0 || packPrice < 0 || usedQuantity <= 0) {
      throw new Error('Indique uma quantidade positiva e um preço válido para cada ingrediente.');
    }
    return (packPrice / packQuantity) * usedQuantity;
  });
  const totalCost = lineCosts.reduce((total, amount) => total + amount, 0);
  const unitCost = totalCost / yieldCount;
  const totalSales = salePrice * yieldCount;
  const unitProfit = salePrice - unitCost;
  const totalProfit = unitProfit * yieldCount;
  if (![totalCost, unitCost, totalSales, unitProfit, totalProfit].every(Number.isFinite)) {
    throw new Error('Os valores ultrapassam o limite de cálculo.');
  }
  return {
    lineCosts, totalCost, unitCost, totalSales, unitProfit, totalProfit,
    markup: unitCost > 0 ? salePrice / unitCost - 1 : null,
    margin: salePrice > 0 ? unitProfit / salePrice : null,
  };
}

export function parseDecimal(input: string) {
  const value = input.trim().replace(',', '.');
  return /^(?:\d{1,9})(?:\.\d{1,6})?$/.test(value) ? Number(value) : NaN;
}
