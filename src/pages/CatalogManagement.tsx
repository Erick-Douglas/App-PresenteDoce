import { useState, type FormEvent } from 'react';
import { ChevronDown, ChevronUp, Pencil, Plus, Search } from 'lucide-react';
import { CategoryEditButton } from '../components/CategoryEditButton';
import { formatEuros } from '../features/checkout/order';
import { createCatalogCategory, imageUrl, type AdminCategoryRow, type CatalogRow } from '../features/products/catalogApi';
import { catalogField, catalogPrimary, catalogSecondary, categoryNameFrom } from './CategoryEditor';

const filters = [['all', 'Todos'], ['published', 'Publicados'], ['draft', 'Rascunhos']] as const;
const searchText = (value: string) => value.trim().normalize('NFD').replace(/\p{Diacritic}/gu, '').toLocaleLowerCase('pt-PT');

export default function CatalogManagement({ categories, rows, token, onNew, onEdit, onEditCategory, onCategoryCreated }: {
  categories: AdminCategoryRow[];
  rows: CatalogRow[];
  token: string;
  onNew: () => void;
  onEdit: (id: string) => void;
  onEditCategory: (id: string) => void;
  onCategoryCreated: (category: AdminCategoryRow) => void;
}) {
  const [selected, setSelected] = useState('');
  const [expanded, setExpanded] = useState(() => new Set(categories.slice(0, 1).map(category => category.id)));
  const [filter, setFilter] = useState<(typeof filters)[number][0]>('all');
  const [query, setQuery] = useState('');
  const [newName, setNewName] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const current = categories.some(item => item.id === selected) ? selected : '';
  const term = searchText(query);
  const groups = categories.filter(category => !current || category.id === current).map(category => ({
    category,
    products: rows.filter(row => row.details.category === category.name &&
      (filter === 'all' || row.published === (filter === 'published')) &&
      searchText(row.details.name).includes(term)),
  })).filter(group => group.products.length || (!term && filter === 'all'));

  function toggle(id: string) {
    setExpanded(previous => {
      const next = new Set(previous);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function create(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (creating) return;
    setError('');
    try {
      const name = categoryNameFrom(newName ?? '');
      setCreating(true);
      const created = await createCatalogCategory(name, token);
      onCategoryCreated(created);
      setNewName(null);
      setSelected(created.id);
      setFilter('all');
      setQuery('');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível criar a categoria.');
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="type-module text-primary">Gerir catálogo</h1>
          <p className="mt-1 text-sm text-muted">{categories.length} {categories.length === 1 ? 'categoria' : 'categorias'} · {rows.length} {rows.length === 1 ? 'produto' : 'produtos'}</p>
        </div>
        <button type="button" className={catalogPrimary + ' inline-flex items-center gap-2'} onClick={onNew}><Plus size={17} aria-hidden="true" /> Novo produto</button>
      </div>
      <div className="grid items-start gap-4 md:grid-cols-[14rem_minmax(0,1fr)]">
        <nav aria-label="Filtrar por categoria" className="ui-glass-panel flex flex-wrap items-start gap-1 md:flex-col">
          {[{ id: '', name: 'Todas' }, ...categories].map(category => (
            <button key={category.id} type="button" aria-pressed={current === category.id}
              className="min-h-11 rounded-xl px-3 text-left text-sm text-on-surface hover:bg-primary/5 aria-pressed:bg-primary/8 aria-pressed:font-bold aria-pressed:text-primary md:w-full"
              onClick={() => setSelected(category.id)}>{category.name}</button>
          ))}
          <div className="w-full border-t border-outline pt-1">
            <button type="button" className="ui-quiet-action" aria-expanded={newName !== null} disabled={creating}
              onClick={() => { setError(''); setNewName(newName === null ? '' : null); }}>
              <Plus size={16} strokeWidth={1.65} aria-hidden="true" /> Nova categoria
            </button>
            {newName !== null && (
              <form onSubmit={create} className="space-y-2 rounded-lg bg-surface/75 p-2">
                <label className="block space-y-1 text-sm">
                  <span>Nome da categoria</span>
                  <input className={catalogField} maxLength={60} required value={newName} onChange={event => setNewName(event.target.value)} />
                </label>
                <div className="flex flex-wrap gap-x-2">
                  <button className="ui-quiet-action font-bold" disabled={creating} type="submit">{creating ? 'A criar…' : 'Confirmar nome'}</button>
                  <button className="ui-quiet-action" type="button" disabled={creating} onClick={() => { setNewName(null); setError(''); }}>Cancelar</button>
                </div>
                {error && <p role="alert" className="text-sm text-primary">{error}</p>}
              </form>
            )}
          </div>
        </nav>
        <section aria-label="Produtos por categoria" className="min-w-0 space-y-3">
          <div className="ui-glass-panel flex flex-wrap items-center gap-2">
            <label className="flex min-w-40 flex-1 items-center gap-2 rounded-xl border border-outline bg-surface px-3">
              <Search size={16} aria-hidden="true" className="text-muted" />
              <span className="sr-only">Procurar produto</span>
              <input type="search" className="min-h-11 min-w-0 flex-1 bg-transparent text-base" value={query}
                onChange={event => setQuery(event.target.value)} placeholder="Procurar produto" />
            </label>
            <div role="group" aria-label="Estado dos produtos" className="flex flex-wrap gap-1">
              {filters.map(([id, label]) => <button key={id} type="button" aria-pressed={filter === id}
                className={catalogSecondary + ' aria-pressed:border-primary/20 aria-pressed:bg-primary/5'}
                onClick={() => setFilter(id)}>{label}</button>)}
            </div>
          </div>
          {!groups.length && <p className="py-4 text-sm text-muted">Nenhum produto corresponde à seleção.</p>}
          {groups.map(({ category, products }) => {
            const open = current === category.id || !!term || filter !== 'all' || expanded.has(category.id);
            const forced = current === category.id || !!term || filter !== 'all';
            return (
              <section key={category.id} aria-label={category.name} className="ui-card">
                <div className="flex flex-wrap items-center justify-between gap-x-2 px-3 py-2 sm:px-4">
                  <h2 className="type-item min-w-0 break-words text-primary">{category.name}</h2>
                  <div className="flex flex-wrap items-center gap-1">
                    <CategoryEditButton category={category} onEdit={onEditCategory} />
                    {!forced && <button type="button" className="ui-icon-action"
                      aria-label={(open ? 'Recolher ' : 'Expandir ') + category.name} aria-expanded={open} onClick={() => toggle(category.id)}>
                      {open ? <ChevronUp size={15} aria-hidden="true" /> : <ChevronDown size={15} aria-hidden="true" />}
                    </button>}
                  </div>
                </div>
                {open && (products.length ? (
                  <ul className="divide-y divide-muted-fill border-t border-muted-fill">
                    {products.map(row => (
                      <li key={row.id} className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
                        {row.details.image && <img src={imageUrl(row.details.image)} alt="" loading="lazy" className="size-10 shrink-0 rounded-lg object-cover sm:size-12" />}
                        <div className="min-w-0 flex-1">
                          <p className="break-words text-sm">{row.details.name}</p>
                          <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted">
                            <span className="tabular-nums">{formatEuros(row.details.price)}</span>
                            <span className={'rounded-full px-2 py-0.5 ' + (row.published ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900')}>
                              {row.published ? 'Publicado' : 'Rascunho'}
                            </span>
                          </div>
                        </div>
                        <button type="button" className="ui-quiet-action" aria-label={'Editar ' + row.details.name} onClick={() => onEdit(row.id)}>
                          <Pencil size={14} strokeWidth={1.65} aria-hidden="true" /> Editar
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : <p className="border-t border-muted-fill px-4 py-3 text-sm text-muted">Ainda não há produtos nesta categoria.</p>)}
              </section>
            );
          })}
        </section>
      </div>
    </div>
  );
}
