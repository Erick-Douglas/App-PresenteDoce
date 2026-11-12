import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Search } from 'lucide-react';
import { BUSINESS_INFO, CATEGORIES } from '../config/constants';
import type { CartItem, Product, View } from '../config/types';
import { formatEuros } from '../features/checkout/order';
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

function searchText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');
}

export function HomeScreen({
  products, cart, favorites, onOpenMenu, isAdmin, onSetCategory, onProductClick, onEditProduct,
  onToggleFavorite, onToggleCartItem, onNavigate,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const highlights = products.filter(product => product.topSeller).sort((a, b) => a.topSeller! - b.topSeller!);
  const featured = highlights.find(product => product.image) ?? products.find(product => product.image);
  const otherHighlights = highlights.filter(product => product.id !== featured?.id);
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
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <Header onOpenMenu={onOpenMenu} />

      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <section aria-label="Abertura da loja"
          className="relative isolate flex min-h-[17.5rem] flex-col justify-end overflow-hidden rounded-[1.75rem] bg-[#351a26] px-4 pt-12 pb-4 text-white sm:min-h-[21rem] sm:px-8 sm:pb-7">
          {featured && (
            <img src={featured.image} alt="" fetchPriority="high" decoding="async" referrerPolicy="no-referrer"
              className="absolute inset-0 -z-20 size-full object-cover object-[center_48%]" />
          )}
          <div aria-hidden="true" className="absolute inset-0 -z-10 bg-linear-to-t from-[#220e1b]/95 via-[#271421]/58 to-[#291322]/12 sm:bg-linear-to-r sm:from-[#240f1c]/95 sm:via-[#271421]/58 sm:to-[#291322]/12" />
          <div className="w-full max-w-lg space-y-3">
            {isAdmin ? (
              <section aria-labelledby="admin-greeting"
                className="rounded-2xl border border-white/30 bg-[#23131e]/80 px-4 py-4 shadow-[inset_0_1px_0_0_#ffffff24] backdrop-blur-md sm:px-6 sm:py-5">
                <h1 id="admin-greeting" className="font-editorial text-4xl leading-none text-[#fff9f0] sm:text-5xl">Olá, {BUSINESS_INFO.adminDisplayName}!</h1>
                <p className="mt-2 text-sm leading-relaxed text-white/95">O que vamos fazer hoje na {BUSINESS_INFO.name}?</p>
              </section>
            ) : featured ? (
              <div className="max-w-md px-1">
                <h1 className="font-editorial text-4xl leading-[0.99] text-[#fff9f0] sm:text-6xl">{featured.name}</h1>
                <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <p className="text-sm font-bold text-[#fff9f0]">
                    {featured.configuravel ? 'A partir de ' : ''}{formatEuros(featured.price)}
                  </p>
                  <button type="button" onClick={() => onProductClick(featured)}
                    className="inline-flex min-h-11 items-center gap-2 rounded-full border border-white/45 bg-[#25151e]/70 px-3.5 text-sm font-semibold text-white hover:bg-[#25151e] focus-visible:outline-2 focus-visible:outline-white">
                    Ver produto <ArrowRight size={15} strokeWidth={1.7} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ) : (
              <h1 className="px-1 font-editorial text-4xl leading-tight text-[#fff9f0] sm:text-5xl">{BUSINESS_INFO.description}</h1>
            )}

            <label className="flex min-h-12 items-center gap-2.5 rounded-2xl bg-[#fffdf9] px-3.5 text-stone-700 shadow-sm focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-2">
              <Search size={19} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-primary" />
              <span className="sr-only">O que você procura?</span>
              <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
                placeholder="O que você procura?" className="min-h-12 w-full bg-transparent text-base outline-none placeholder:text-stone-600" />
            </label>
          </div>
        </section>

        {filtered ? (
          <section aria-labelledby="search-results" className="space-y-4 pt-6">
            <div>
              <h2 id="search-results" className="font-editorial text-3xl leading-tight text-stone-900">Resultados para “{searchQuery.trim()}”</h2>
              <p role="status" className="text-sm text-stone-600">
                {filtered.length === 0 ? 'Nenhum produto encontrado.' : filtered.length + (filtered.length === 1 ? ' produto' : ' produtos')}
              </p>
            </div>
            <div className={productGrid}>{filtered.map(card)}</div>
          </section>
        ) : (
          <div className="space-y-8 pt-6 sm:space-y-10 sm:pt-8">
            <section aria-labelledby="category-title">
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 id="category-title" className="font-editorial text-3xl text-stone-900">Categorias</h2>
                <button type="button" onClick={() => showCategory('all')}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-primary hover:underline">
                  Ver catálogo <ArrowRight size={15} aria-hidden="true" />
                </button>
              </div>
              <div className="flex flex-wrap gap-2 sm:gap-3">
                {CATEGORIES.map(category => (
                  <button key={category.name} type="button" onClick={() => showCategory(category.name)}
                    className="flex min-h-11 items-center gap-2 rounded-full border border-stone-200 bg-white py-1.5 pr-3 pl-1.5 text-xs font-bold text-stone-800 hover:border-primary/35 focus-visible:outline-2 focus-visible:outline-primary sm:text-sm">
                    <img src={category.image} alt="" width={32} height={32} loading="lazy" className="size-8 shrink-0 rounded-full object-cover" />
                    {category.name}
                  </button>
                ))}
              </div>
            </section>

            {otherHighlights.length > 0 && (
              <section aria-labelledby="highlights-title" className="space-y-3">
                <h2 id="highlights-title" className="font-editorial text-3xl text-stone-900">Em destaque</h2>
                <div className={productGrid}>{otherHighlights.map(card)}</div>
              </section>
            )}

            {CATEGORIES.map(category => {
              const categoryProducts = products.filter(product => product.category === category.name);
              if (!categoryProducts.length) return null;
              return (
                <section key={category.name} className="space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <h2 className="font-editorial text-3xl text-stone-900">{category.name}</h2>
                    <button type="button" aria-label={'Ver tudo em ' + category.name} onClick={() => showCategory(category.name)}
                      className="inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg px-1 text-sm font-semibold text-primary hover:underline">
                      Ver tudo <ArrowRight size={15} aria-hidden="true" />
                    </button>
                  </div>
                  <div className={productGrid}>{categoryProducts.map(card)}</div>
                </section>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}
