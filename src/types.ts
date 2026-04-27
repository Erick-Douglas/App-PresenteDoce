export type Category = 'Bolos Caseiros' | 'Bolos Temáticos' | 'Doces' | 'Salgados' | 'Kit Festa';

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  image: string;
  rating?: number;
  reviewsCount?: number;
  isNew?: boolean;
  topSeller?: 1 | 2 | 3;
  configuravel?: boolean; // Produto com personalização obrigatória (Bolos Temáticos)
  simples?: boolean;      // Produto sem nenhuma customização (Bolos Caseiros)
}

export type View = 'welcome' | 'home' | 'product-list' | 'product-details' | 'cart' | 'saved' | 'categories-list' | 'settings' | 'contact';

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
}
