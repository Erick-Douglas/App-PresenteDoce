import type { ReactNode } from 'react';
import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import type { CatalogCategory, Product } from '../config/types';
import type { StorePresentation } from '../features/products/storePresentation';
import { CatalogGrid, type CatalogActions } from '../components/CatalogGrid';
import { CategoryEditButton } from '../components/CategoryEditButton';
import { Header } from '../components/Header';

interface HomeScreenProps extends CatalogActions {
  products: Product[];
  categories: CatalogCategory[];
  onOpenMenu: () => void;
  isAdmin: boolean;
  catalogNotice: ReactNode;
  presentation: StorePresentation;
  search: string;
  selection: string | null;
  onSearch: (value: string) => void;
  onSelect: (value: string) => void;
  onEditCategory?: (id: string) => void;
}

function searchText(value: string) {
  return value.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');
}

export function HomeScreen({ products, categories, onOpenMenu, isAdmin, catalogNotice, presentation, search, selection, onSearch, onSelect, onEditCategory, ...actions }: HomeScreenProps) {
  const query = searchText(search.trim());
  const current = selection === '' || (selection === null && query) ? undefined :
    categories.find(category => (category.id ?? category.name) === selection) ?? categories[0];
  const results = products.filter(product => (!current || product.category === current.name) &&
    (!query || [product.name, product.category, product.description, ...(product.tags ?? [])].some(value => searchText(value).includes(query))));
  const groups = new Map<string, Product[]>();
  if (!current) {
    for (const category of categories) groups.set(category.name, []);
    for (const product of results) {
      const items = groups.get(product.category);
      if (items) items.push(product);
      else groups.set(product.category, [product]);
    }
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen bg-porcelain pb-32">
      <section aria-labelledby="home-greeting" className="store-masthead">
        <Header onOpenMenu={onOpenMenu} />
        <div className="page-width pb-7 pt-5 sm:pb-8 sm:pt-7">
          <h1 id="home-greeting" className="type-display text-on-strong">
            {isAdmin ? 'Olá, ' + presentation.admin_name + '!' : presentation.home_title}
          </h1>
          <p className="mt-1 text-sm text-on-primary">{presentation.home_description}</p>
          <label className="home-search mt-4 flex min-h-12 max-w-2xl items-center gap-2.5 px-4">
            <Search size={19} strokeWidth={1.7} aria-hidden="true" className="shrink-0" />
            <span className="sr-only">O que você procura?</span>
            <input type="search" value={search} onChange={event => onSearch(event.target.value)}
              placeholder="O que você procura?" className="min-h-12 min-w-0 flex-1 bg-transparent text-base outline-none placeholder:text-on-primary/90" />
          </label>
        </div>
      </section>
      <div className="page-width space-y-3 pt-2.5 sm:pt-3">
        {catalogNotice}
        <nav aria-labelledby="category-title">
          <div className="mb-1.5 flex items-center justify-between gap-2">
            <h2 id="category-title" className="type-section text-on-surface">Categorias</h2>
            {current && <CategoryEditButton category={current} onEdit={onEditCategory} />}
          </div>
          <div className="category-rail" role="group" aria-label="Filtrar por categoria">
            {categories.map(category => {
              const id = category.id ?? category.name;
              return <button type="button" key={id} className="category-pill" aria-pressed={current === category}
                onClick={() => onSelect(id)}>{category.name}</button>;
            })}
            <button type="button" className="category-pill" aria-pressed={!current} onClick={() => onSelect('')}>Todos</button>
          </div>
        </nav>
        <section aria-label="Produtos" className="space-y-5">
          <p role="status" className={results.length ? 'sr-only' : 'py-6 text-sm text-muted'}>
            {results.length ? results.length + (results.length === 1 ? ' produto' : ' produtos') : 'Nenhum produto encontrado.'}
          </p>
          {current ? <CatalogGrid products={results} {...actions} /> :
            Array.from(groups, ([name, items]) => items.length > 0 && (
              <section key={name} aria-label={name} className="space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <h2 className="type-section">{name}</h2>
                  <CategoryEditButton category={categories.find(category => category.name === name) ?? { name }} onEdit={onEditCategory} />
                </div>
                <CatalogGrid products={items} {...actions} />
              </section>
            ))}
        </section>
      </div>
    </motion.div>
  );
}
