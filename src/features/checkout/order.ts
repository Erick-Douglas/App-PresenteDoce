import type { CartItem } from '../../config/types.ts';

export interface CheckoutDetails {
  name: string;
  phone: string;
  fulfillment: 'pickup' | 'delivery';
  address: string;
  payment: 'cash' | 'mbway' | 'wise';
  date: string;
  changeFor: string;
}

const paymentNames = { cash: 'Dinheiro', mbway: 'MB WAY', wise: 'Wise' };
const euros = new Intl.NumberFormat('pt-PT', { style: 'currency', currency: 'EUR' });

export function formatEuros(value: number) {
  return euros.format(value);
}

export function orderSubtotal(cart: CartItem[]) {
  return cart.reduce((total, item) => total + Math.round(item.price * 100) * item.quantity, 0) / 100;
}

export function prepareOrder(cart: CartItem[], details: CheckoutDetails) {
  if (!cart.length) throw new Error('Adicione um produto antes de continuar.');
  const name = details.name.trim();
  const phone = details.phone.trim();
  const digits = phone.replace(/\D/g, '');
  if (!name || !/^\+?[\d\s().-]+$/.test(phone) || digits.length < 9 || digits.length > 15) {
    throw new Error('Indique o seu nome e um telefone válido.');
  }
  if (details.fulfillment === 'delivery' && !details.address.trim()) {
    throw new Error('Indique a morada de entrega.');
  }

  const subtotal = orderSubtotal(cart);
  const changeFor = details.changeFor.trim().replace(',', '.');
  if (details.payment === 'cash' && changeFor &&
      (!/^\d+(\.\d{1,2})?$/.test(changeFor) || Number(changeFor) < subtotal)) {
    throw new Error('O valor para troco deve cobrir pelo menos o subtotal.');
  }

  const itemLines = cart.map(item => {
    const options = [
      item.variant,
      item.tamanho,
      item.massa && 'Massa: ' + item.massa,
      item.recheio1 && 'Recheio: ' + item.recheio1,
      item.recheio2 && item.recheio2 !== item.recheio1 && 'Segundo recheio: ' + item.recheio2,
      item.selectedSauce && 'Molho: ' + item.selectedSauce,
      item.adicionais?.length && 'Adicionais: ' + item.adicionais.join(', '),
      item.selectedFlavors?.length && 'Opções: ' + item.selectedFlavors.join(', '),
      item.tema && 'Tema: ' + item.tema,
      item.observations && 'Observações: ' + item.observations,
    ].filter(Boolean);
    return ['• ' + item.quantity + ' × ' + item.name + ' — ' + formatEuros(orderSubtotal([item])), ...options.map(option => '  ' + option)].join('\n');
  });

  return [
    'Olá! Gostaria de confirmar esta encomenda com a Presente Doce.',
    name + ' · ' + phone,
    itemLines.join('\n\n'),
    details.date && 'Data pretendida: ' + details.date.split('-').reverse().join('/'),
    details.fulfillment === 'delivery'
      ? 'Entrega em: ' + details.address.trim() + '\nTaxa e total com entrega a confirmar.'
      : 'Recolha no local, em horário a confirmar.',
    'Preferência de pagamento: ' + paymentNames[details.payment] +
      (details.payment === 'cash' && changeFor ? ' (troco para ' + formatEuros(Number(changeFor)) + ')' : ''),
    'Subtotal dos produtos: ' + formatEuros(subtotal),
  ].filter(Boolean).join('\n\n');
}

export function whatsappLink(number: string, message: string) {
  return 'https://wa.me/' + number.replace(/\D/g, '') + '?text=' + encodeURIComponent(message);
}
