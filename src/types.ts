export type Category = 'Bolos' | 'Doces' | 'Salgados' | 'Kit Festa';

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
}
