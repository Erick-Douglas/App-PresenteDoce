import test from 'node:test';
import assert from 'node:assert/strict';
import { formatCatalogPrice, parseCatalogPrice } from '../src/features/products/catalogFields.ts';
import { currencySymbol, formatEuros } from '../src/features/checkout/order.ts';

test('catalog price keeps whole euros and normalizes decimal separators', () => {
  for (const value of ['20', '20,0', '20.00']) assert.equal(parseCatalogPrice(value), 20);
  assert.equal(parseCatalogPrice('20,01'), 20.01);
  assert.equal(parseCatalogPrice('0'), 0);
  assert.equal(parseCatalogPrice('99999,99'), 99999.99);
  assert.equal(formatCatalogPrice(20), '20,00');
  assert.equal(formatEuros(20).replace(/\s/g, ' '), formatCatalogPrice(20) + ' ' + currencySymbol);
});

test('catalog price rejects malformed values and matches database precision', () => {
  for (const value of ['', '20,001', '1.000,00', '20€', '-1', '100000', '1e2']) {
    assert.equal(parseCatalogPrice(value), null, value);
  }
});
