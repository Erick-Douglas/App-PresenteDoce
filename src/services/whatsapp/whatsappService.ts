import { CartItem } from '../../config/types';
import { AddressState } from '../../features/checkout/useCheckout';
import { BUSINESS_INFO } from '../../config/constants';

interface OrderPayload {
  customerName: string;
  customerPhone: string;
  deliveryMethod: string | null;
  address: AddressState;
  paymentMethod: string | null;
  needsChange: boolean;
  changeAmount: string;
  currentDeliveryFee: number;
  cart: CartItem[];
  grandTotal: number;
}

export function generateWhatsAppOrderLink(payload: OrderPayload): string {
  const {
    customerName,
    customerPhone,
    deliveryMethod,
    address,
    paymentMethod,
    needsChange,
    changeAmount,
    currentDeliveryFee,
    cart,
    grandTotal
  } = payload;

  const deliveryInfo = deliveryMethod === 'delivery'
    ? `\nEndereço: ${address.address}${address.apartment ? `, ${address.apartment}` : ''}${address.city ? ` (${address.city})` : ''}\nCEP: ${address.postal_code || '-'}\nEntrega: € ${currentDeliveryFee.toFixed(2)}`
    : `\nRecolha no local: ${BUSINESS_INFO.address}`;

  const labels: Record<string, string> = { cash: 'Dinheiro', mbway: 'MB WAY', wise: 'Wise' };
  const paymentLabel = paymentMethod === 'cash' && needsChange
    ? `${labels.cash} (Troco para € ${changeAmount})`
    : (paymentMethod ? labels[paymentMethod] : 'Não informado');

  const itemsList = cart
    .map((item) => {
      let line = `- ${item.quantity}x ${item.name} (€ ${(item.price * item.quantity).toFixed(2)})`;
      if (item.tamanho) line += `\n  📏 Tamanho: ${item.tamanho}`;
      if (item.massa) line += `\n  🍰 Massa: ${item.massa}`;
      if (item.recheio1) line += `\n  🍫 Recheio 1: ${item.recheio1}`;
      if (item.recheio2 && item.recheio2 !== item.recheio1) line += `\n  🍫 Recheio 2: ${item.recheio2}`;
      if (item.tema) line += `\n  🎨 Tema: ${item.tema}`;
      if (['Brigadeiros', 'Salgados'].includes(item.category)) {
        if (item.variant) line += `\n  📦 ${item.variant}`;
        if (item.selectedFlavors && item.selectedFlavors.length > 0) {
          line += `\n  ${item.category === 'Salgados' ? '🥟 Opções' : '🍬 Sabores'}: ${item.selectedFlavors.join(', ')}`;
        }
      }
      if (item.observations) line += `\n  📝 Obs: ${item.observations}`;
      return line;
    })
    .join('\n\n');

  const text = `🛒 *NOVO PEDIDO*\n\n👤 *Cliente:* ${customerName}\n📱 *Contato:* ${customerPhone}\n\n*ITENS:*\n${itemsList}\n${deliveryInfo}\n\n💳 *Pagamento:* ${paymentLabel}\n💰 *Total da Encomenda: € ${grandTotal.toFixed(2)}*`;

  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${BUSINESS_INFO.whatsapp.replace(/\D/g, '')}?text=${encodedText}`;
}
