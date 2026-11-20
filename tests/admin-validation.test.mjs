import test from 'node:test';
import assert from 'node:assert/strict';
import { validatePricingRecipe } from '../src/features/pricing/recipe.ts';
import { filterCatalog } from '../src/features/products/catalogFilter.ts';
import { validateProductImage } from '../src/features/products/productImage.ts';

const valid = { title: 'Ficha', yieldCount: '4', salePrice: '2,50',
  ingredients: [{ name: 'Ingrediente', unit: 'g', packQuantity: '1000', packPrice: '4', usedQuantity: '250' }] };
test('guarded pricing accepts a complete sheet and rejects incomplete or invalid costs', () => {
  assert.equal(validatePricingRecipe(valid).totalCost, 1);
  for (const field of ['yieldCount', 'salePrice']) assert.throws(() => validatePricingRecipe({ ...valid, [field]: '' }));
  for (const field of ['name', 'packQuantity', 'packPrice', 'usedQuantity']) {
    assert.throws(() => validatePricingRecipe({ ...valid, ingredients: [{ ...valid.ingredients[0], [field]: '' }] }));
  }
  assert.throws(() => validatePricingRecipe({ ...valid, yieldCount: '0' }));
  assert.throws(() => validatePricingRecipe({ ...valid, ingredients: [{ ...valid.ingredients[0], packPrice: '-1' }] }));
});
test('topic filtering uses category and stable ids, including after renaming a topic', () => {
  const category = { name: 'Bolos', topics: [{ id: 'a', name: 'Sem açúcar' }] };
  const products = [
    { id: 'one', name: 'Doce', category: 'Bolos', description: '', topicIds: ['a'], tags: ['Antigo nome'] },
    { id: 'two', name: 'Outro', category: 'Bolos', description: '', topicIds: [] },
    { id: 'three', name: 'Doce', category: 'Caixas', description: '', topicIds: ['a'] },
  ];
  assert.deepEqual(filterCatalog(products, category, 'a', '').map(p => p.id), ['one']);
  assert.equal(filterCatalog(products, category, '', '').length, 2);
  assert.equal(filterCatalog(products, undefined, '', '').length, 3);
  assert.equal(filterCatalog(products, category, 'a', 'outro').length, 0);
  assert.equal(filterCatalog([{ ...products[0], topicIds: undefined, tags: ['Sem acucar'] }], category, 'a', '').length, 1);
});
test('photo validation rejects an oversized replacement before upload', () => {
  assert.doesNotThrow(() => validateProductImage({ name: 'valida.png', type: 'image/png', size: 200 }));
  assert.throws(() => validateProductImage({ name: 'grande.png', type: 'image/png', size: 21 * 1024 * 1024 }));
  assert.throws(() => validateProductImage({ name: 'documento.pdf', type: 'application/pdf', size: 200 }));
});
