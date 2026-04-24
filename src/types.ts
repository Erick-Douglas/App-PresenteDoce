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

export type View = 'welcome' | 'home' | 'product-list' | 'product-details' | 'cart' | 'saved' | 'profile' | 'categories-list' | 'settings' | 'register' | 'orders' | 'address-editor' | 'admin';

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

export interface User {
  id?: string;
  name: string;
  email: string;
  phone?: string;
  profilePic?: string | null;
  address?: string;
  city?: string;
  postal_code?: string;
  apartment?: string;
  reference?: string;
  birthday?: string;
  sex?: string;
  has_default_address?: boolean;
  hasUsedFirstPurchaseCoupon?: boolean;
  couponCode?: string;
  is_admin?: boolean;
}
