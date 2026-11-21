export type CakeOption = string | { label: string; extra_cents: number };
export type Store = {
  id: string;
  slug: string;
  name: string;
  logo_url: string;
  primary_color: string;
  currency: string;
  timezone: string;
  visible: boolean;
};
export type StoreSettings = {
  whatsapp: string;
  email: string;
  address: string;
  hours: string;
  lead_days: number;
  preorder_only?: boolean;
  min_notice_hours?: number;
  daily_capacity: number;
  deposit_percent: number;
  delivery_fee_cents: number | null;
  delivery_enabled: boolean;
  cake_masses: CakeOption[];
  cake_fillings: CakeOption[];
  gallery: { image: string; title: string; category_id: string }[];
};
export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  notes: string;
  version: number;
  archived: boolean;
};
export type Order = {
  id: string;
  reference: number;
  customer_id: string;
  kind: "order" | "quote";
  status: string;
  delivery_date: string;
  delivery_time?: string;
  delivery_at?: string;
  fulfillment: "pickup" | "delivery";
  customer_snapshot: {
    name: string;
    phone: string;
    email: string;
    address: string;
  };
  notes: string;
  total_cents: number;
  delivery_cents: number;
  delivery_pending: boolean;
  deposit_percent: number;
  deposit_cents: number;
  capacity_units: number;
  version: number;
  currency: string;
  created_at: string;
};
export type OrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  option_key: string;
  quantity: number;
  mode: "ready" | "preorder";
  unit_cents: number;
  unit_cost_cents: number | null;
  snapshot: { name: string };
  configuration: Record<string, unknown>;
};
export type FinanceEntry = {
  version?: number;
  voided_at?: string | null;
  replaced_by?: string | null;
  id: string;
  order_id: string | null;
  type: "receipt" | "refund" | "expense";
  amount_cents: number;
  description: string;
  method: string;
  day: string;
};
export type Ingredient = {
  id: string;
  name: string;
  brand: string;
  unit: "g" | "ml" | "un";
  pack_quantity: number;
  pack_price_cents: number;
  stock_quantity: number;
  version: number;
};
export type Stock = {
  product_id: string;
  option_key: string;
  available: number;
};
export type CalendarBlock = {
  day: string;
  blocked: boolean;
  capacity: number | null;
  reason: string;
};
export type Snapshot = {
  store: Store;
  settings: { settings: StoreSettings; version: number };
  entitlement: { status: string; expires_at: string | null };
  customers: Customer[];
  orders: Order[];
  items: OrderItem[];
  finance: FinanceEntry[];
  stock: Stock[];
  blocks: CalendarBlock[];
  ingredients: Ingredient[];
};
export type OrderPayload = {
  idempotency_key: string;
  delivery_date: string;
  delivery_time?: string;
  fulfillment: "pickup" | "delivery";
  customer: { name: string; phone: string; email: string; address: string };
  customer_id?: string;
  kind?: "order" | "quote";
  notes?: string;
  items: {
    product_id: string;
    variant: string;
    quantity: number;
    mode: "ready" | "preorder";
    configuration: Record<string, unknown>;
  }[];
};
