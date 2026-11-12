import { useState, type FormEvent } from 'react';
import { ArrowDown, ArrowUp, Pencil, Plus, Trash2 } from 'lucide-react';
import {
  deleteCatalogCategory, saveCatalogCategory, type AdminCategoryRow, type CatalogRow, type CatalogTopic,
} from '../features/products/catalogApi';
import { moveCatalogItem } from '../features/products/catalogFields';

export const catalogPrimary = 'min-h-11 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50';
export const catalogSecondary = 'min-h-11 rounded-xl border border-stone-200 bg-white px-3 py-2.5 text-sm font-bold text-primary hover:border-primary/30 disabled:opacity-50';
export const catalogField = 'w-full min-w-0 rounded-xl border border-stone-300 bg-white px-3 py-2 text-base';
const actionIcon = 'grid size-11 shrink-0 place-items-center rounded-xl text-primary hover:bg-primary/5 disabled:opacity-35';
const panel = 'space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-5';
const normalize = (text: string) => text.normalize('NFC').trim().replace(/\s+/g, ' ');

export function categoryNameFrom(value: string) {
  const name = normalize(value);
  if (!name || name.length > 60 || name.toLowerCase() === 'all') {
    throw new Error('Indique um nome de categoria válido com até 60 caracteres.');
  }
  return name;
}

export type CategoryChange = {
  previous: AdminCategoryRow;
  saved?: AdminCategoryRow;
  destination?: AdminCategoryRow;
};

function SortList({ items, onMove, empty }: {
  items: { id: string; name: string }[];
  onMove: (index: number, offset: -1 | 1) => void;
  empty: string;
}) {
  if (!items.length) return <p className="text-sm text-stone-600">{empty}</p>;
  return (
    <ul className="divide-y divide-stone-100">
      {items.map((item, index) => (
        <li key={item.id} className="flex min-h-12 items-center gap-1">
          <span className="min-w-0 flex-1 break-words text-sm">{item.name}</span>
          <button type="button" className={actionIcon} aria-label={'Subir ' + item.name}
            disabled={index === 0} onClick={() => onMove(index, -1)}><ArrowUp size={17} aria-hidden="true" /></button>
          <button type="button" className={actionIcon} aria-label={'Descer ' + item.name}
            disabled={index === items.length - 1} onClick={() => onMove(index, 1)}><ArrowDown size={17} aria-hidden="true" /></button>
        </li>
      ))}
    </ul>
  );
}

export function CategoryEditor({ category, categories, rows, token, onBack, onChanged }: {
  category: AdminCategoryRow;
  categories: AdminCategoryRow[];
  rows: CatalogRow[];
  token: string;
  onBack: () => void;
  onChanged: (change: CategoryChange) => void;
}) {
  const [name, setName] = useState(category.name);
  const [topics, setTopics] = useState(category.topics);
  const [topicEditor, setTopicEditor] = useState<CatalogTopic | null>(null);
  const [section, setSection] = useState<'details' | 'products' | 'categories'>('details');
  const [originalProducts] = useState(() => rows.filter(row => row.details.category === category.name)
    .map(row => ({ id: row.id, name: row.details.name })));
  const [originalCategories] = useState(() => categories.map(item => ({ id: item.id, name: item.name })));
  const [productOrder, setProductOrder] = useState(originalProducts);
  const [categoryOrder, setCategoryOrder] = useState(originalCategories);
  const [deleting, setDeleting] = useState(false);
  const [destination, setDestination] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  function confirmTopic() {
    if (!topicEditor) return;
    const label = normalize(topicEditor.name);
    if (!label || label.length > 80 ||
        topics.some(topic => topic.id !== topicEditor.id && topic.name.toLowerCase() === label.toLowerCase())) {
      setError('Indique um nome diferente para o tópico, com até 80 caracteres.');
      return;
    }
    const saved = { id: topicEditor.id || crypto.randomUUID(), name: label };
    setTopics(current => topicEditor.id ? current.map(topic => topic.id === saved.id ? saved : topic) : [...current, saved]);
    setTopicEditor(null);
    setError('');
  }

  async function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (topicEditor) {
      setSection('details');
      setError('Confirme ou cancele o tópico em edição.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const updated = { ...category, name: categoryNameFrom(name), topics };
      const changes = (before: { id: string }[], after: { id: string }[]) =>
        before.some((item, index) => item.id !== after[index]?.id)
          ? { current: before.map(item => item.id), next: after.map(item => item.id) } : undefined;
      await saveCatalogCategory(updated, token, changes(originalProducts, productOrder), changes(originalCategories, categoryOrder));
      onChanged({ previous: category, saved: { ...updated, revision: category.revision + 1 } });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível guardar a categoria.');
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (busy) return;
    const target = categories.find(item => item.id === destination);
    if (originalProducts.length && !target) {
      setError('Escolha uma categoria de destino para os produtos.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      await deleteCatalogCategory(category, target?.id ?? null, token);
      onChanged({ previous: category, destination: target });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir a categoria.');
    } finally {
      setBusy(false);
    }
  }

  const tabs = [
    ['details', 'Dados e tópicos'], ['products', 'Ordem dos produtos'], ['categories', 'Ordem das categorias'],
  ] as const;
  const topicForm = topicEditor && (
    <div className="flex flex-wrap items-end gap-2 py-2">
      <label className="min-w-40 flex-1 space-y-1 text-sm">
        <span>Nome do tópico</span>
        <input className={catalogField} maxLength={80} value={topicEditor.name}
          onChange={event => setTopicEditor({ ...topicEditor, name: event.target.value })}
          onKeyDown={event => {
            if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); confirmTopic(); }
          }} />
      </label>
      <button type="button" className={catalogPrimary} onClick={confirmTopic}>Confirmar tópico</button>
      <button type="button" className={catalogSecondary} onClick={() => { setTopicEditor(null); setError(''); }}>Cancelar tópico</button>
    </div>
  );

  return (
    <form onSubmit={save} className="space-y-4">
      <fieldset disabled={busy} className="min-w-0 space-y-4">
        <div role="group" aria-label="Opções da categoria" className="flex flex-wrap gap-2">
          {tabs.map(([id, title]) => (
            <button key={id} type="button" aria-pressed={section === id}
              onClick={() => setSection(id)}
              className={catalogSecondary + ' aria-pressed:border-primary/20 aria-pressed:bg-primary/5'}>{title}</button>
          ))}
        </div>
        {section === 'details' && (
          <div className={panel}>
            <label className="block max-w-xl space-y-1 text-sm">
              <span>Nome da categoria</span>
              <input className={catalogField} required maxLength={60} value={name} onChange={event => setName(event.target.value)} />
            </label>
            <section aria-label="Tópicos da categoria">
              <div className="flex flex-wrap items-center gap-x-3">
                <h3 className="font-headline text-lg font-bold text-primary">Tópicos da categoria</h3>
                <button type="button" disabled={!!topicEditor || topics.length >= 100}
                  onClick={() => { setError(''); setTopicEditor({ id: '', name: '' }); }}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-lg px-2 text-sm font-bold text-primary hover:bg-primary/5 disabled:opacity-40">
                  <Plus size={16} aria-hidden="true" /> Adicionar tópico
                </button>
              </div>
              {!topics.length && !topicEditor && <p className="text-sm text-stone-600">Ainda não há tópicos.</p>}
              <ul className="divide-y divide-stone-100">
                {topics.map(topic => (
                  <li key={topic.id}>
                    {topicEditor?.id === topic.id ? topicForm : (
                      <div className="flex min-h-12 items-center gap-1">
                        <span className="min-w-0 flex-1 break-words text-sm">{topic.name}</span>
                        <button type="button" disabled={!!topicEditor} className={actionIcon} aria-label={'Editar tópico ' + topic.name}
                          onClick={() => { setError(''); setTopicEditor(topic); }}><Pencil size={16} aria-hidden="true" /></button>
                        <button type="button" className={actionIcon} aria-label={'Excluir tópico ' + topic.name}
                          onClick={() => setTopics(current => current.filter(item => item.id !== topic.id))}><Trash2 size={16} aria-hidden="true" /></button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
              {topicEditor?.id === '' && topicForm}
            </section>
          </div>
        )}
        {section === 'products' && (
          <section className={panel} aria-label="Ordem dos produtos">
            <p className="text-sm text-stone-600">A vitrine mostra os produtos publicados nesta ordem.</p>
            <SortList items={productOrder} empty="Esta categoria ainda não tem produtos."
              onMove={(index, offset) => setProductOrder(current => moveCatalogItem(current, index, offset))} />
          </section>
        )}
        {section === 'categories' && (
          <section className={panel} aria-label="Ordem das categorias">
            <p className="text-sm text-stone-600">Esta ordem aparece nos atalhos e no catálogo da loja.</p>
            <SortList items={categoryOrder.map(item => item.id === category.id ? { ...item, name: name || category.name } : item)}
              empty="Ainda não há categorias." onMove={(index, offset) => setCategoryOrder(current => moveCatalogItem(current, index, offset))} />
          </section>
        )}
        {deleting && (
          <section className={panel} aria-label="Confirmar exclusão de categoria">
            <h3 className="text-lg font-bold text-primary">Excluir {category.name}?</h3>
            {originalProducts.length > 0 && <>
              <label className="block max-w-md space-y-1 text-sm">
                <span>Mover {originalProducts.length} {originalProducts.length === 1 ? 'produto' : 'produtos'} para</span>
                <select className={catalogField} value={destination} onChange={event => setDestination(event.target.value)}>
                  <option value="">Selecione a categoria de destino</option>
                  {categories.filter(item => item.id !== category.id).map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
                </select>
              </label>
              <p className="text-sm text-stone-600">Os produtos mantêm preços e opções de encomenda. Os tópicos passam para a categoria de destino quando existe um tópico com o mesmo nome.</p>
            </>}
            <div className="flex flex-wrap gap-2">
              <button type="button" className={catalogSecondary} onClick={() => { setDeleting(false); setError(''); }}>Cancelar exclusão</button>
              <button type="button" className={catalogPrimary} onClick={remove}>Confirmar exclusão</button>
            </div>
          </section>
        )}
        {error && <p role="alert" className="text-sm text-primary">{error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <button type="submit" className={catalogPrimary}>{busy ? 'A guardar…' : 'Guardar alterações'}</button>
          <button type="button" className={catalogSecondary} onClick={onBack}>Voltar</button>
          {!deleting && <button type="button" className="min-h-11 rounded-xl px-3 text-sm font-bold text-primary hover:bg-primary/5"
            onClick={() => setDeleting(true)}>Excluir categoria</button>}
        </div>
      </fieldset>
    </form>
  );
}
