import test from 'node:test';
import assert from 'node:assert/strict';
import { calculatePricing, parseDecimal } from '../src/features/pricing/calculation.ts';

test('recipe cost, profit, markup and margin match the spreadsheet formulas', () => {
  const result = calculatePricing([
    { packQuantity: 1000, packPrice: 4, usedQuantity: 250 },
    { packQuantity: 6, packPrice: 3, usedQuantity: 4 },
    { packQuantity: 20, packPrice: 10, usedQuantity: 2 },
  ], 4, 2.5);
  assert.deepEqual(result.lineCosts, [1, 2, 1]);
  assert.equal(result.totalCost, 4);
  assert.equal(result.unitCost, 1);
  assert.equal(result.totalSales, 10);
  assert.equal(result.unitProfit, 1.5);
  assert.equal(result.totalProfit, 6);
  assert.equal(result.markup, 1.5);
  assert.equal(result.margin, 0.6);
});

test('undefined percentages are left empty when there is no cost or sale', () => {
  const result = calculatePricing([{ packQuantity: 1, packPrice: 0, usedQuantity: 1 }], 1, 0);
  assert.equal(result.markup, null);
  assert.equal(result.margin, null);
});

test('decimal comma is accepted and invalid quantities are rejected', () => {
  assert.equal(parseDecimal('2,45'), 2.45);
  assert.ok(Number.isNaN(parseDecimal('1.000,00')));
  assert.throws(() => calculatePricing([{ packQuantity: 0, packPrice: 4, usedQuantity: 2 }], 1, 10), /quantidade/);
  assert.throws(() => calculatePricing([{ packQuantity: 1, packPrice: 4, usedQuantity: 2 }], 0, 10), /rendimento/);
});
