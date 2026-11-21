import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { BUSINESS_INFO } from "../../config/constants";
import { setCurrency } from "../checkout/order";
import { catalogConfigured, imageUrl, request } from "../products/catalogApi";
import { pilotStoreId, setActiveStore } from "../products/storeContext";
import type { CalendarBlock, Stock, Store, StoreSettings } from "./types";
import type { CapacityDay } from "../checkout/schedule";
type PublicStore = { store: Store; settings: StoreSettings };
type Value = PublicStore & {
  stock: Stock[];
  blocks: CalendarBlock[];
  days: CapacityDay[];
  reload: () => Promise<void>;
};
const Context = createContext<Value | null>(null);
export function useStore() {
  const value = useContext(Context);
  if (!value) throw Error("Loja não carregada.");
  return value;
}
export function storePath() {
  return /^\/lojas\/[a-z0-9-]+\/?$/.test(window.location.pathname)
    ? window.location.pathname.replace(/\/$/, "")
    : "";
}
const fallback: PublicStore = {
  store: {
    id: pilotStoreId,
    slug: "presente-doce",
    name: BUSINESS_INFO.name,
    logo_url: "/logo.png",
    primary_color: "#800000",
    currency: "EUR",
    timezone: "Europe/Lisbon",
    visible: true,
  },
  settings: {
    whatsapp: BUSINESS_INFO.whatsapp,
    email: BUSINESS_INFO.email,
    address: BUSINESS_INFO.address,
    hours: "Por marcação",
    lead_days: 2,
    preorder_only: true,
    min_notice_hours: 48,
    daily_capacity: 8,
    deposit_percent: 50,
    delivery_fee_cents: null,
    delivery_enabled: true,
    cake_masses: [],
    cake_fillings: [],
    gallery: [],
  },
};
function apply(value: PublicStore) {
  document.documentElement.style.setProperty(
    "--pd-color-brand",
    value.store.primary_color,
  );
  document.title = value.store.name;
  setCurrency(value.store.currency);
  const pilot = value.store.id === pilotStoreId;
  Object.assign(BUSINESS_INFO, {
    name: value.store.name,
    whatsapp: value.settings.whatsapp || "",
    email: value.settings.email || "",
    address: value.settings.address || "",
    description: pilot
      ? "Confeitaria artesanal por encomenda. Bolos, doces e salgados feitos à mão para tornar a sua celebração ainda mais especial."
      : "Conheça o catálogo de " +
        value.store.name +
        " e faça a sua encomenda.",
    website:
      window.location.origin + (pilot ? "/" : "/lojas/" + value.store.slug),
    instagram: pilot ? "https://www.instagram.com/presentedoce.s2/" : "",
    facebook: pilot ? "https://www.facebook.com/share/1BK8xUmdcZ/" : "",
    adminDisplayName: pilot ? "Gabriela" : value.store.name,
  });
}
export function StoreProvider({ children }: { children: ReactNode }) {
  const [value, setValue] = useState<PublicStore | null>(null),
    [stock, setStock] = useState<Stock[]>([]),
    [blocks, setBlocks] = useState<CalendarBlock[]>([]),
    [days, setDays] = useState<CapacityDay[]>([]),
    [error, setError] = useState(""),
    [attempt, setAttempt] = useState(0);
  async function reload() {
    const [next, availability] = await Promise.all([
      request<PublicStore | null>("/rest/v1/rpc/storefront_config", {
        method: "POST",
        body: "{}",
      }),
      request<{
        stock?: Stock[];
        blocks?: CalendarBlock[];
        days?: CapacityDay[];
      }>("/rest/v1/rpc/storefront_availability", {
        method: "POST",
        body: "{}",
      }),
    ]);
    if (!next) throw Error("Esta loja não está disponível.");
    apply(next);
    setValue(next);
    setStock(availability.stock || []);
    setBlocks(availability.blocks || []);
    setDays(availability.days || []);
  }
  useEffect(() => {
    let active = true;
    setError("");
    (async () => {
      if (!catalogConfigured) {
        if (storePath()) throw Error("Loja indisponível neste ambiente.");
        apply(fallback);
        setValue(fallback);
        return;
      }
      const slug = storePath().split("/")[2];
      if (slug) {
        const rows = await request<Store[]>(
          "/rest/v1/stores?slug=eq." + encodeURIComponent(slug) + "&select=*",
        );
        if (!rows.length) throw Error("Esta loja não foi encontrada.");
        setActiveStore(rows[0].id);
      }
      await reload();
    })().catch((e) => {
      if (active)
        setError(
          e instanceof Error ? e.message : "Não foi possível carregar a loja.",
        );
    });
    return () => {
      active = false;
    };
  }, [attempt]);
  if (error)
    return (
      <main className="page-width py-12 space-y-4">
        <h1 className="type-module">Não foi possível abrir a loja</h1>
        <p role="alert">{error}</p>
        <button className="ui-primary" onClick={() => setAttempt((n) => n + 1)}>
          Tentar novamente
        </button>
      </main>
    );
  if (!value)
    return (
      <main className="page-width py-12" role="status">
        A preparar a sua loja…
      </main>
    );
  return (
    <Context.Provider value={{ ...value, stock, blocks, days, reload }}>
      {children}
    </Context.Provider>
  );
}
export function StoreLogo() {
  const { store } = useStore();
  return (
    <img
      src={imageUrl(store.logo_url)}
      alt={store.name}
      className="w-32 h-auto max-h-16 object-contain"
    />
  );
}
export function stockFor(stock: Stock[], id: string, option = "") {
  return (
    stock.find((s) => s.product_id === id && s.option_key === option)
      ?.available ?? 0
  );
}
export function options(values: StoreSettings["cake_masses"]) {
  return values.map((v) =>
    typeof v === "string" ? { label: v, extra_cents: 0 } : v,
  );
}
