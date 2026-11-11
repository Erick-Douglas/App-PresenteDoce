import { BUSINESS_INFO } from '../config/constants';
import { whatsappLink } from '../features/checkout/order';

const inquiry = 'Olá! Gostaria de pedir um orçamento para uma encomenda empresarial.\n\nEmpresa:\nData pretendida:\nQuantidade aproximada:\nLocal de entrega ou recolha:\nO que procura:';

export function BusinessOrdersLink() {
  return (
    <a
      href={whatsappLink(BUSINESS_INFO.whatsapp, inquiry)}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex rounded-xl border border-primary/20 px-4 py-3 font-semibold text-primary hover:bg-primary/5"
    >
      Encomendas para empresas
    </a>
  );
}
