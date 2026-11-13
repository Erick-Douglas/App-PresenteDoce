export type ProductOrderMode = 'simple' | 'cake' | 'brigadeiros' | 'salgados';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  tags?: string[];
  topicIds?: string[];
  orderMode?: ProductOrderMode;
  rating?: number;
  reviewsCount?: number;
  isNew?: boolean;
  topSeller?: 1 | 2 | 3;
  configuravel?: boolean; // Produto com personalização obrigatória (Bolos Temáticos)
  simples?: boolean;      // Produto sem nenhuma customização (Bolos Caseiros)
  variants?: { label: string; price: number; maxFlavors?: number }[]; // Ex: Caixa com 6 (5€)
  flavors?: string[];     // Sabores disponíveis
}

export type View = 'welcome' | 'home' | 'product-list' | 'product-details' | 'cart' | 'saved' | 'categories-list' | 'settings' | 'contact' |
  'catalog-admin' | 'product-editor' | 'category-editor' | 'pricing' | 'store-texts';

export interface CartItem extends Product {
  cartId: string;
  quantity: number;
  selectedSauce?: string;
  observations?: string;
  massa?: string;
  recheio1?: string;
  recheio2?: string;
  adicionais?: string[];
  tamanho?: string;   // Para Bolos Temáticos
  tema?: string;      // Descrição do tema do bolo
  selectedFlavors?: string[]; // Sabores escolhidos
  variant?: string;   // Variante escolhida (Ex: Caixa com 6)
}
export interface CatalogCategory {
  id?: string;
  name: string;
  image?: string;
  orderMode?: ProductOrderMode;
}

