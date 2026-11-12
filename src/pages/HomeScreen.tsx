import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { BUSINESS_INFO, CATEGORIES } from '../config/constants';
import type { CartItem, Product, View } from '../config/types';
import { CatalogCard } from '../components/CatalogCard';
import { Header } from '../components/Header';

interface HomeScreenProps {
  products: Product[];
  cart: CartItem[];
  favorites: string[];
  onOpenMenu: () => void;
  isAdmin: boolean;
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
  onNavigate: (view: View) => void;
}

const productGrid = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4';
const productShelf = 'scrollbar-hide -mx-4 grid snap-x grid-flow-col auto-cols-[46%] gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 [&>article]:snap-start sm:mx-0 sm:grid-flow-row sm:grid-cols-3 sm:gap-5 sm:overflow-visible sm:px-0';
const sectionTitle = 'font-headline text-xl font-extrabold tracking-tight text-stone-900 sm:text-2xl';
const browseLink = 'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary';

function searchText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');
}

export function HomeScreen({
  products, cart, favorites, onOpenMenu, isAdmin, onSetCategory, onProductClick, onEditProduct,
  onToggleFavorite, onToggleCartItem, onNavigate,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const ranked = products.filter(product => product.topSeller).sort((a, b) => (a.topSeller ?? 0) - (b.topSeller ?? 0));
  const highlights = ranked.length ? ranked.slice(0, 3) : products.slice(0, 3);
  const filtered = useMemo(() => {
    const query = searchText(searchQuery.trim());
    return query ? products.filter(product =>
      [product.name, product.category, product.description, ...(product.tags ?? [])]
        .some(value => searchText(value).includes(query)),
    ) : null;
  }, [products, searchQuery]);

  function showCategory(category: string) {
    onSetCategory(category);
    onNavigate('product-list');
  }

  function card(product: Product) {
    return <CatalogCard key={product.id} product={product} inCart={cart.some(item => item.id === product.id)}
      favorite={favorites.includes(product.id)} onOpen={onProductClick} onFavorite={onToggleFavorite}
      onCart={onToggleCartItem} onEdit={onEditProduct} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-white pb-32">
      <Header onOpenMenu={onOpenMenu} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div aria-hidden="true" className="mt-3 grid h-[9.75rem] grid-cols-[1.55fr_1fr] grid-rows-2 gap-1 overflow-hidden rounded-2xl bg-[#f6ebe3] sm:mt-5 sm:h-56 sm:grid-cols-[1.35fr_1fr_1fr] sm:grid-rows-1 sm:gap-1.5 sm:rounded-3xl">
          <img src="/products/bc-6.jpg" alt="" fetchPriority="high" decoding="async"
            className="row-span-2 h-full min-h-0 w-full object-cover object-[center_47%] sm:row-span-1" />
          <img src="/products/br-1.jpg" alt="" decoding="async" className="h-full min-h-0 w-full object-cover object-[center_42%]" />
          <img src="/products/sl-1.jpg" alt="" decoding="async" className="h-full min-h-0 w-full object-cover" />
        </div>

        <div className="mt-4 space-y-3 sm:mt-5">
          {isAdmin && (
            <section aria-labelledby="admin-greeting" className="rounded-xl border border-primary/10 bg-primary/[0.04] px-3.5 py-2.5 sm:px-4">
              <h1 id="admin-greeting" className="font-headline text-lg font-extrabold leading-snug text-primary">Olá, {BUSINESS_INFO.adminDisplayName}!</h1>
              <p className="text-sm leading-snug text-stone-700">O que vamos fazer hoje na {BUSINESS_INFO.name}?</p>
            </section>
          )}
          {!isAdmin && <h1 className="sr-only">{BUSINESS_INFO.name}</h1>}
          <label className="flex min-h-12 items-center gap-2.5 rounded-full border border-stone-200 bg-stone-50 px-4 text-stone-700 focus-within:border-primary/35 focus-within:ring-2 focus-within:ring-primary/20">
            <Search size={19} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-primary" />
            <span className="sr-only">O que você procura?</span>
            <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
              placeholder="O que você procura?" className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-600" />
          </label>
        </div>

        {filtered ? (
          <section aria-labelledby="search-results" className="space-y-4 pt-6">
            <div>
              <h2 id="search-results" className={sectionTitle}>Resultados para “{searchQuery.trim()}”</h2>
              <p role="status" className="mt-1 text-sm text-stone-600">
                {filtered.length === 0 ? 'Nenhum produto encontrado.' : filtered.length + (filtered.length === 1 ? ' produto' : ' produtos')}
              </p>
            </div>
            <div className={productGrid}>{filtered.map(card)}</div>
          </section>
        ) : (
          <div className="space-y-7 pt-5 sm:space-y-9 sm:pt-6">
            <nav aria-labelledby="category-title">
              <h2 id="category-title" className="sr-only">Categorias</h2>
              <div className="grid grid-cols-5 gap-1.5 sm:flex sm:gap-6">
                {CATEGORIES.map(category => (
                  <button key={category.name} type="button" onClick={() => showCategory(category.name)}
                    className="group flex min-w-0 flex-col items-center gap-1.5 rounded-xl px-0.5 py-1 text-center text-[11px] leading-tight font-bold text-stone-800 focus-visible:outline-2 focus-visible:outline-primary sm:w-24 sm:text-sm">
                    <span className="block size-[clamp(2.65rem,14vw,3.5rem)] overflow-hidden rounded-[0.9rem] bg-primary/5 ring-1 ring-primary/10 group-hover:ring-primary/40 sm:size-[4.25rem]">
                      <img src={category.image} alt="" width={68} height={68} decoding="async" className="size-full object-cover" />
                    </span>
                    <span>{category.name}</span>
                  </button>
                ))}
              </div>
            </nav>

            {highlights.length > 0 && (
              <section aria-labelledby="highlights-title" className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="highlights-title" className={sectionTitle}>Em destaque</h2>
                  <button type="button" onClick={() => showCategory('all')} className={browseLink}>
                    Ver catálogo <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className={productShelf}>{highlights.map(card)}</div>
              </section>
            )}

            {CATEGORIES.map(category => {
              const categoryProducts = products.filter(product => product.category === category.name);
              if (!categoryProducts.length) return null;
              return (
                <section key={category.name} className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className={sectionTitle}>{category.name}</h2>
                    <button type="button" aria-label={'Ver tudo em ' + category.name} onClick={() => showCategory(category.name)} className={browseLink}>
                      Ver tudo <ChevronRight size={16} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={productShelf + ' lg:grid-cols-4'}>{categoryProducts.map(card)}</div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
