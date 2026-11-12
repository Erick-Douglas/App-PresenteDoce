import { useMemo, useState, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, Search } from 'lucide-react';
import { BUSINESS_INFO } from '../config/constants';
import type { CartItem, CatalogCategory, Product, View } from '../config/types';
import { CatalogCard } from '../components/CatalogCard';
import { CategoryCover } from '../components/CategoryCover';
import { CategoryEditButton } from '../components/CategoryEditButton';
import { Header } from '../components/Header';

interface HomeScreenProps {
  products: Product[];
  categories: CatalogCategory[];
  cart: CartItem[];
  favorites: string[];
  onOpenMenu: () => void;
  isAdmin: boolean;
  catalogNotice: ReactNode;
  onSetCategory: (cat: string) => void;
  onProductClick: (product: Product) => void;
  onEditProduct?: (id: string) => void;
  onEditCategory?: (id: string) => void;
  onToggleFavorite: (id: string) => void;
  onToggleCartItem: (product: Product) => void;
  onNavigate: (view: View) => void;
}

const productGrid = 'grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 lg:grid-cols-4';
const productShelf = 'home-rail -mx-4 grid snap-x grid-flow-col auto-cols-[46%] gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pb-2 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-primary [&>article]:snap-start sm:-mx-6 sm:auto-cols-[13.5rem] sm:gap-4 sm:scroll-px-6 sm:px-6 lg:auto-cols-[15rem]';
const sectionTitle = 'font-headline text-xl font-bold tracking-tight text-primary sm:text-2xl';
const browseLink = 'inline-flex min-h-11 shrink-0 items-center gap-1 rounded-lg px-1 text-sm font-bold text-primary hover:underline focus-visible:outline-2 focus-visible:outline-primary';

function searchText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');
}

export function HomeScreen({
  products, categories, cart, favorites, onOpenMenu, isAdmin, catalogNotice, onSetCategory, onProductClick, onEditProduct, onEditCategory,
  onToggleFavorite, onToggleCartItem, onNavigate,
}: HomeScreenProps) {
  const [searchQuery, setSearchQuery] = useState('');
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

  function jumpToCategory(category: string, index: number) {
    const section = document.getElementById('home-category-' + index);
    if (!section) {
      showCategory(category);
      return;
    }
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    section.scrollIntoView({ block: 'start', behavior: reducedMotion ? 'instant' : 'smooth' });
    section.querySelector('h2')?.focus({ preventScroll: true });
  }

  function card(product: Product) {
    return <CatalogCard key={product.id} product={product} inCart={cart.some(item => item.id === product.id)}
      favorite={favorites.includes(product.id)} onOpen={onProductClick} onFavorite={onToggleFavorite}
      onCart={onToggleCartItem} onEdit={onEditProduct} />;
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="home-surface flex min-h-screen flex-col">
      <section aria-labelledby="home-greeting" className="home-hero">
        <Header onOpenMenu={onOpenMenu} />
        <div className="relative mx-auto max-w-6xl px-4 pt-6 pb-20 sm:px-6 sm:pt-10 sm:pb-24">
          <h1 id="home-greeting" className="font-logo text-[clamp(2.4rem,10vw,4.2rem)] leading-[1.12] font-normal text-white">
            {isAdmin ? 'Olá, ' + BUSINESS_INFO.adminDisplayName + '!' : 'Seja bem-vindo!'}
          </h1>
          <p className="mt-2 max-w-[25rem] text-sm leading-snug text-cream sm:text-base">
            {isAdmin ? 'O que vamos fazer hoje na ' + BUSINESS_INFO.name + '?' : 'Bolos, doces e salgados feitos por encomenda.'}
          </p>
          <label className="home-search mt-5 flex min-h-12 max-w-2xl items-center gap-2.5 rounded-full px-4 sm:mt-6">
            <Search size={19} strokeWidth={1.7} aria-hidden="true" className="shrink-0 text-primary" />
            <span className="sr-only">O que você procura?</span>
            <input type="search" value={searchQuery} onChange={event => setSearchQuery(event.target.value)}
              placeholder="O que você procura?" className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-stone-600" />
          </label>
        </div>
      </section>

      <div className="flex-1 pb-32">
        {catalogNotice}
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          {filtered ? (
            <section aria-labelledby="search-results" className="space-y-4 pt-2 sm:pt-4">
              <div>
                <h2 id="search-results" className={sectionTitle}>Resultados para “{searchQuery.trim()}”</h2>
                <p role="status" className="mt-1 text-sm text-stone-600">
                  {filtered.length === 0 ? 'Nenhum produto encontrado.' : filtered.length + (filtered.length === 1 ? ' produto' : ' produtos')}
                </p>
              </div>
              <div className={productGrid}>{filtered.map(card)}</div>
            </section>
          ) : (
            <div className="space-y-7 pt-2 sm:space-y-9 sm:pt-4">
              <nav aria-labelledby="category-title">
                <div className="flex items-center justify-between gap-2">
                  <h2 id="category-title" className={sectionTitle}>Categorias</h2>
                  <button type="button" onClick={() => showCategory('all')} className={browseLink}>
                    Ver catálogo <ChevronRight size={16} aria-hidden="true" />
                  </button>
                </div>
                <div className="home-rail -mx-4 flex snap-x gap-3 overflow-x-auto overscroll-x-contain scroll-px-4 px-4 pt-1 pb-2 sm:-mx-6 sm:gap-5 sm:scroll-px-6 sm:px-6">
                  {categories.map((category, index) => (
                    <div key={category.id ?? category.name} className="relative w-[4.75rem] shrink-0 snap-start sm:w-[5.5rem]">
                      <button type="button" onClick={() => jumpToCategory(category.name, index)}
                        className="flex w-full flex-col items-center gap-2 rounded-xl px-0.5 py-1 text-center text-xs leading-tight font-bold text-primary focus-visible:outline-2 focus-visible:outline-primary sm:text-sm">
                        <span className="block size-[4.25rem] rounded-full bg-linear-to-tr from-primary via-primary to-gold p-[2px] sm:size-[4.75rem]">
                          <CategoryCover category={category} className="border-2 border-cream" />
                        </span>
                        <span>{category.name}</span>
                      </button>
                      <CategoryEditButton category={category} onEdit={onEditCategory} compact />
                    </div>
                  ))}
                </div>
              </nav>

              {categories.map((category, index) => {
                const categoryProducts = products.filter(product => product.category === category.name);
                if (!categoryProducts.length) return null;
                return (
                  <section key={category.name} id={'home-category-' + index} aria-labelledby={'home-category-title-' + index} className="scroll-mt-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <h2 id={'home-category-title-' + index} tabIndex={-1} className={sectionTitle}>{category.name}</h2>
                      <button type="button" aria-label={'Ver tudo em ' + category.name} onClick={() => showCategory(category.name)} className={browseLink}>
                        Ver tudo <ChevronRight size={16} aria-hidden="true" />
                      </button>
                    </div>
                    <div tabIndex={0} role="group" aria-label={'Produtos de ' + category.name} className={productShelf}>{categoryProducts.map(card)}</div>
                  </section>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
