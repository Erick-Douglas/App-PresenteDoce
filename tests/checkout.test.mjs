import test from 'node:test';
import assert from 'node:assert/strict';
import { orderSubtotal, prepareOrder, whatsappLink } from '../src/features/checkout/order.ts';

const details = { name: 'Cliente de teste', phone: '+351 910 000 000', fulfillment: 'pickup', address: '', payment: 'mbway', date: '2026-12-01', changeFor: '' };
const item = { id: 'teste', cartId: 'teste-1', quantity: 3, name: 'Produto de teste', price: 10.1, variant: 'Caixa', selectedFlavors: ['Opção A', 'Opção B'] };

test('subtotal uses cents and the message preserves options and date', () => {
  assert.equal(orderSubtotal([item]), 30.3);
  const message = prepareOrder([item], details);
  assert.match(message, /Caixa/);
  assert.match(message, /Opção A, Opção B/);
  assert.match(message, /01\/12\/2026/);
  assert.match(message, /Recolha/);
  assert.match(message, /30,30/);
});

test('delivery requires an address and makes the delivery fee pending', () => {
  assert.throws(() => prepareOrder([item], { ...details, fulfillment: 'delivery' }), /morada/);
  const message = prepareOrder([item], { ...details, fulfillment: 'delivery', address: 'Morada fictícia' });
  assert.match(message, /Taxa e total com entrega a confirmar/);
  assert.match(message, /Morada fictícia/);
});

test('checkout rejects empty cart, invalid phone and insufficient cash', () => {
  assert.throws(() => prepareOrder([], details), /produto/);
  assert.throws(() => prepareOrder([item], { ...details, phone: 'telefone 123' }), /telefone/);
  assert.throws(() => prepareOrder([item], { ...details, payment: 'cash', changeFor: '20' }), /subtotal/);
  assert.match(prepareOrder([item], { ...details, payment: 'cash', changeFor: '40,50' }), /troco para 40,50/);
});

test('WhatsApp message is encoded as data for the configured number', () => {
  const text = 'Olá & encomenda #1?';
  const url = new URL(whatsappLink('+351 900 000 000', text));
  assert.equal(url.origin, 'https://wa.me');
  assert.equal(url.pathname, '/351900000000');
  assert.equal(url.searchParams.get('text'), text);
});
