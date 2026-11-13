import { useEffect, useState, type FormEvent } from 'react';
import { Plus } from 'lucide-react';
import { THEMED_CAKE_SIZES } from '../config/constants';
import type { Product, ProductOrderMode } from '../config/types';
import {
  createCatalogCategory, deleteProduct, getCatalogProduct, imageUrl, saveProduct, uploadProductImage, type AdminCategoryRow, type CatalogRow,
} from '../features/products/catalogApi';
import { formatCatalogPrice, parseCatalogPrice, productOrderMode } from '../features/products/catalogFields';
import { currencySymbol, formatEuros } from '../features/checkout/order';
import { CategoryEditor, categoryNameFrom, type CategoryChange } from './CategoryEditor';

const primary = 'ui-primary';
const secondary = 'ui-secondary';
const field = 'ui-field';
const chip = 'rounded-full border border-primary/15 px-3 py-1.5 text-sm text-primary';
type Variant = { label: string; price: string; maxFlavors: string };
const optionFields = new Map<ProductOrderMode, { title: string; label: string; example: string; add: string }>([
  ['cake', { title: 'Tamanhos do bolo', label: 'Tamanho', example: 'Pequeno (1,5 kg)', add: 'Adicionar tamanho' }],
  ['brigadeiros', { title: 'Tamanhos da caixa', label: 'Caixa', example: 'Caixa com 12', add: 'Adicionar caixa' }],
  ['salgados', { title: 'Quantidades disponíveis', label: 'Quantidade', example: '25 unidades', add: 'Adicionar quantidade' }],
]);
const parseList = (value: string) => [...new Set(value.split('\n').map(item => item.trim()).filter(Boolean))];
const topicKey = (value: string) => value.trim().toLocaleLowerCase('pt-PT');

function productContent(details: CatalogRow['details']) {
  return JSON.stringify(Object.entries(details).filter(([key]) => !['category', 'topicIds', 'tags'].includes(key))
    .sort(([a], [b]) => a.localeCompare(b)));
}

function priceFrom(value: string) {
  const price = parseCatalogPrice(value);
  if (price === null) throw new Error('Indique um preço válido com até duas casas decimais.');
  return price;
}

function PriceInput({ label, value, onChange, required }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}) {
  return (
    <label className="block space-y-1">
      <span>{label}</span>
      <span className="relative block">
        <input className={field + ' pr-9 tabular-nums'} value={value} onChange={event => onChange(event.target.value)}
          onBlur={() => {
            const price = parseCatalogPrice(value);
            if (price !== null) onChange(formatCatalogPrice(price));
          }}
          inputMode="decimal" maxLength={8} placeholder="0,00" required={required} />
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-muted">{currencySymbol}</span>
      </span>
    </label>
  );
}

type CategoryFields = {
  categories: AdminCategoryRow[];
  rows: CatalogRow[];
  onCategoryCreated: (category: AdminCategoryRow) => void;
  onCategoryChanged: (change: CategoryChange) => void;
};

function ProductForm({ row, token, onSaved, onDeleted, onCancel, categories, rows, onCategoryCreated, onCategoryChanged }: CategoryFields & {
  row: CatalogRow | null;
  token: string;
  onSaved: (row: CatalogRow) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const data = row?.details;
  const initialCategory = data ? categories.find(item => item.name === data.category) : categories[0];
  const [productId] = useState(() => row?.id ?? crypto.randomUUID());
  const [baseline, setBaseline] = useState(row);
  const version = baseline?.version ?? null;
  const [categoryId, setCategoryId] = useState(initialCategory?.id ?? '');
  const [managingCategory, setManagingCategory] = useState(false);
  const [categoryDraft, setCategoryDraft] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [price, setPrice] = useState(data ? formatCatalogPrice(data.price) : '');
  const [topicDrafts, setTopicDrafts] = useState<Record<string, string[]>>(() => initialCategory ? {
    [initialCategory.id]: data?.topicIds ?? initialCategory.topics.filter(topic =>
      data?.tags?.some(tag => topicKey(tag) === topicKey(topic.name))).map(topic => topic.id),
  } : {});
  const [variantDrafts, setVariantDrafts] = useState<Record<string, Variant[]>>(() => {
    if (!data) return {};
    const savedOptions = data.variants ?? [];
    const options: NonNullable<Product['variants']> =
      !savedOptions.length && productOrderMode(data) === 'cake' && row?.published ? THEMED_CAKE_SIZES : savedOptions;
    return { [productOrderMode(data)]: options.map(option => ({
      label: option.label,
      price: formatCatalogPrice(option.price),
      maxFlavors: option.maxFlavors == null ? '' : String(option.maxFlavors),
    })) };
  });
  const [flavorDrafts, setFlavorDrafts] = useState(() => new Map(data ? [[productOrderMode(data), data.flavors?.join('\n') ?? '']] : []));
  const [image, setImage] = useState(data?.image ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const selectedCategory = categories.find(item => item.id === categoryId);
  const mode = data ? productOrderMode(data) : selectedCategory?.order_mode ?? 'simple';
  const optionFieldsForCategory = optionFields.get(mode);
  const isThemedCake = mode === 'cake';
  const variants = optionFieldsForCategory ? variantDrafts[mode] ?? [] : [];
  const optionPrices = variants.map(option => parseCatalogPrice(option.price));
  const lowestPrice = optionPrices.length && optionPrices.every(value => value !== null)
    ? Math.min(...optionPrices) : null;
  const chosenTopics = selectedCategory?.topics.filter(topic => topicDrafts[categoryId]?.includes(topic.id)) ?? [];

  async function addCategory() {
    if (busy || creatingCategory) return;
    setCategoryError('');
    try {
      const name = categoryNameFrom(categoryDraft ?? '');
      setCreatingCategory(true);
      const created = await createCatalogCategory(name, token);
      onCategoryCreated(created);
      setCategoryId(created.id);
      setCategoryDraft(null);
    } catch (cause) {
      setCategoryError(cause instanceof Error ? cause.message : 'Não foi possível criar a categoria.');
    } finally {
      setCreatingCategory(false);
    }
  }

  function applyManagedCategory(change: CategoryChange) {
    onCategoryChanged(change);
    setManagingCategory(false);
    if (!change.saved && change.previous.id === categoryId) {
      const target = change.destination ?? categories.find(item => item.id !== categoryId);
      if (target) {
        setTopicDrafts(current => ({ ...current, [target.id]: target.topics
          .filter(topic => chosenTopics.some(chosen => topicKey(chosen.name) === topicKey(topic.name))).map(topic => topic.id) }));
      }
      setCategoryId(target?.id ?? '');
    }
    if (!baseline) return;
    setBusy(true);
    void getCatalogProduct(baseline.id, token).then(updated => {
      const previous = baseline.details;
      const affected = change.previous.name === previous.category;
      const nextCategory = change.saved ?? change.destination;
      const expectedCategory = affected ? nextCategory?.name : previous.category;
      let expectedTopics = previous.topicIds ?? [];
      if (affected && nextCategory) {
        expectedTopics = change.saved
          ? expectedTopics.filter(id => nextCategory.topics.some(topic => topic.id === id))
          : nextCategory.topics.filter(topic => previous.tags?.some(tag => topicKey(tag) === topicKey(topic.name))).map(topic => topic.id);
      }
      if (updated.published === baseline.published && updated.details.category === expectedCategory &&
          JSON.stringify([...(updated.details.topicIds ?? [])].sort()) === JSON.stringify([...expectedTopics].sort()) &&
          productContent(updated.details) === productContent(previous)) {
        setBaseline(updated);
      }
    }).catch(() => {}).finally(() => setBusy(false));
  }

  async function remove() {
    if (!row || busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteProduct({ ...row, version: version ?? row.version }, token);
      onDeleted(row.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir o produto.');
    } finally {
      setBusy(false);
    }
  }

  function setVariants(next: Variant[]) {
    setVariantDrafts(current => ({ ...current, [mode]: next }));
  }

  function updateVariant(index: number, value: Partial<Variant>) {
    setVariants(variants.map((option, i) => i === index ? { ...option, ...value } : option));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || creatingCategory) return;
    if (categoryDraft !== null) {
      setCategoryError('Crie a categoria ou cancele antes de guardar o produto.');
      return;
    }
    setBusy(true);
    setError('');
    const formElement = event.currentTarget;
    const form = new FormData(formElement);
    const text = (name: string) => String(form.get(name) ?? '').trim();
    const name = text('name');
    const description = text('description');
    const published = form.get('published') === 'on';
    try {
      if (!name || !description) throw new Error('Preencha o nome e a descrição.');
      if (!selectedCategory) throw new Error('Escolha uma categoria.');
      const configurable = !!optionFieldsForCategory;
      const options = configurable ? variants.map(option => {
        const label = option.label.trim();
        if (!label) throw new Error('Indique o nome de cada opção.');
        const maxFlavors = isThemedCake || option.maxFlavors === '' ? undefined : Number(option.maxFlavors);
        if (maxFlavors != null && (!Number.isInteger(maxFlavors) || maxFlavors < 1 || maxFlavors > 100)) {
          throw new Error('O limite de sabores deve estar entre 1 e 100.');
        }
        return { label, price: priceFrom(option.price), ...(maxFlavors == null ? {} : { maxFlavors }) };
      }) : [];
      if (new Set(options.map(option => option.label.toLowerCase())).size !== options.length) {
        throw new Error('Dê um nome diferente a cada opção.');
      }
      if (published && configurable && !options.length) throw new Error('Adicione pelo menos uma opção antes de publicar.');
      const productPrice = options.length ? Math.min(...options.map(option => option.price)) : priceFrom(configurable ? '0' : price);
      if (published && productPrice <= 0) throw new Error('Os preços publicados devem ser superiores a zero.');
      const flavors = configurable && !isThemedCake ? parseList(flavorDrafts.get(mode) ?? '') : [];
      if (chosenTopics.length > 20 || flavors.length > 50 || flavors.some(value => value.length > 80)) {
        throw new Error('Use até 20 tópicos e 50 opções de sabor, com até 80 caracteres por sabor.');
      }

      const file = form.get('image');
      let nextImage = image;
      if (file instanceof File && file.size) {
        nextImage = await uploadProductImage(file, token);
        setImage(nextImage);
        const input = formElement.elements.namedItem('image');
        if (input instanceof HTMLInputElement) input.value = '';
      }
      if (published && !nextImage) throw new Error('Adicione uma imagem antes de publicar.');
      const details: Omit<Product, 'id'> = {
        ...data, name, description, category: selectedCategory.name, price: productPrice, image: nextImage,
        orderMode: mode,
        topicIds: chosenTopics.map(topic => topic.id),
        tags: chosenTopics.map(topic => topic.name),
        configuravel: configurable,
        simples: !configurable,
        variants: options.length ? options : undefined,
        flavors: flavors.length ? flavors : undefined,
      };
      const saved = await saveProduct({ id: productId, details, published }, version, token);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (<>
    <form onSubmit={submit} hidden={managingCategory}>
      <fieldset disabled={busy || creatingCategory} className="space-y-4">
        <section aria-label="Dados do produto" className="ui-glass-panel space-y-3">
          <h3 className="type-item text-primary">Dados do produto</h3>
          <label className="block space-y-1"><span>Nome</span><input name="name" required maxLength={100} defaultValue={data?.name} className={field} /></label>
          <label className="block space-y-1"><span>Descrição</span><textarea name="description" rows={2} required maxLength={3000} defaultValue={data?.description} className={field + ' resize-y'} /></label>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-end gap-2">
              <label className="min-w-0 flex-1 space-y-1">
                <span>Categoria</span>
                <select className={field} value={selectedCategory?.id ?? ''} onChange={event => {
                  if (event.target.value === '@manage') setManagingCategory(true);
                  else setCategoryId(event.target.value);
                }} required>
                  <option value="" disabled>Selecione a categoria</option>
                  {categories.map(item => <option value={item.id} key={item.id}>{item.name}</option>)}
                  {selectedCategory && <option value="@manage">Gerir categorias…</option>}
                </select>
              </label>
              <button type="button" aria-label="Criar categoria" aria-expanded={categoryDraft !== null} className="ui-icon-action"
                onClick={() => { setCategoryDraft(''); setCategoryError(''); }}><Plus size={19} aria-hidden="true" /></button>
            </div>
            {!optionFieldsForCategory && <PriceInput label="Preço" value={price} onChange={setPrice} required />}
          </div>
          {categoryDraft !== null && (
            <div className="space-y-2 rounded-lg border border-outline bg-surface/70 p-3">
              <div className="flex flex-wrap items-end gap-2">
              <label className="min-w-44 flex-1 space-y-1">
                <span>Nome da categoria</span>
                <input value={categoryDraft} maxLength={60} className={field} onChange={event => setCategoryDraft(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void addCategory(); }
                  }} />
              </label>
                <button className={primary} type="button" onClick={addCategory}>{creatingCategory ? 'A criar…' : 'Confirmar nome'}</button>
                <button className={secondary} type="button" onClick={() => { setCategoryDraft(null); setCategoryError(''); }}>Cancelar</button>
              </div>
              {categoryError && <p role="alert" className="text-sm font-bold text-primary">{categoryError}</p>}
            </div>
          )}
        </section>
        {selectedCategory && <section aria-label="Tópicos do produto" className="ui-glass-panel space-y-2">
          <div className="flex flex-wrap items-center gap-x-3">
            <h3 className="type-item text-primary">Tópicos de {selectedCategory.name}</h3>
            <button type="button" className="ui-quiet-action"
              onClick={() => setManagingCategory(true)}>Gerir tópicos</button>
          </div>
          {selectedCategory.topics.length ? (
            <div className="flex flex-wrap gap-2">
              {selectedCategory.topics.map(topic => (
                <label key={topic.id} className={chip + ' inline-flex min-h-10 items-center gap-2 has-checked:bg-primary/5'}>
                  <input type="checkbox" className="accent-primary" checked={!!topicDrafts[categoryId]?.includes(topic.id)}
                    onChange={event => {
                      const checked = event.target.checked;
                      setTopicDrafts(current => {
                        const ids = current[categoryId] ?? [];
                        return { ...current, [categoryId]: checked ? [...ids, topic.id] : ids.filter(id => id !== topic.id) };
                      });
                    }} />
                  {topic.name}
                </label>
              ))}
            </div>
          ) : <p className="text-sm text-muted">Esta categoria ainda não tem tópicos.</p>}
        </section>}
        {optionFieldsForCategory && (
          <section className="ui-glass-panel space-y-3">
            <h3 className="type-item text-primary">{optionFieldsForCategory.title}</h3>
            <p className="text-sm text-muted">O cliente escolhe uma opção ao encomendar. Indique o preço total de cada opção.</p>
            <p className="text-sm text-muted">{lowestPrice === null ? 'O card mostra o preço da opção mais barata.' : <>No card <strong>A partir de {formatEuros(lowestPrice)}</strong></>}</p>
            {variants.map((option, index) => (
              <div key={index} className="grid gap-2 border-t border-outline pt-3 sm:grid-cols-2">
                <label><span>{optionFieldsForCategory.label}</span><input className={field} maxLength={80} placeholder={optionFieldsForCategory.example}
                  value={option.label} onChange={event => updateVariant(index, { label: event.target.value })} required /></label>
                <PriceInput label="Preço da opção" value={option.price} onChange={value => updateVariant(index, { price: value })} required />
                {!isThemedCake && <label><span className="text-sm">Máximo de sabores à escolha (opcional)</span><input className={field} inputMode="numeric" maxLength={3}
                  placeholder="Sem limite" value={option.maxFlavors} onChange={event => updateVariant(index, { maxFlavors: event.target.value })} /></label>}
                <button type="button" className="ui-quiet-action justify-self-start"
                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}>Remover opção</button>
              </div>
            ))}
            <button type="button" className={secondary} disabled={variants.length >= 20}
              onClick={() => setVariants([...variants, { label: '', price: '', maxFlavors: '' }])}>{optionFieldsForCategory.add}</button>
            {!isThemedCake && <label className="block space-y-1">
              <span>{mode === 'salgados' ? 'Tipos de salgado (um por linha)' : 'Sabores da caixa (um por linha)'}</span>
              <textarea maxLength={4050} rows={2} className={field} value={flavorDrafts.get(mode) ?? ''}
                onChange={event => {
                  const value = event.target.value;
                  setFlavorDrafts(current => new Map(current).set(mode, value));
                }} />
            </label>}
          </section>
        )}
        <section aria-label="Imagem e publicação" className="ui-glass-panel space-y-3">
          <h3 className="type-item text-primary">Imagem e publicação</h3>
          {image && <img src={imageUrl(image)} alt="Imagem atual do produto" className="h-28 w-36 rounded-xl object-cover" />}
          <label className="block space-y-1"><span>Imagem (JPG, PNG ou WebP até 5 MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={field} /></label>
          <label className="flex min-h-11 items-center gap-3"><input name="published" type="checkbox" defaultChecked={row?.published} className="size-4 accent-primary" /> Mostrar no catálogo público</label>
        </section>
        {error && <p role="alert" className="text-sm font-bold text-primary">{error}</p>}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-outline pt-3">
          <button className={primary} type="submit">{busy ? 'A guardar…' : 'Guardar produto'}</button>
          <button className={secondary} type="button" onClick={onCancel}>Voltar</button>
          {row && !confirmDelete && <button className="ui-quiet-action sm:ml-auto" type="button" onClick={() => setConfirmDelete(true)}>Excluir produto</button>}
        </div>
        {row && confirmDelete && (
          <section aria-label="Confirmar exclusão" className="space-y-3 rounded-xl border border-red-200 bg-red-50 p-4">
            <p><strong>Excluir {row.details.name}?</strong> A exclusão é permanente. Para ocultar o produto temporariamente, desmarque a publicação e guarde.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={secondary} onClick={() => { setConfirmDelete(false); setError(''); }}>Cancelar exclusão</button>
              <button type="button" className={primary} onClick={remove}>Confirmar exclusão</button>
            </div>
          </section>
        )}
      </fieldset>
    </form>
    {managingCategory && selectedCategory && (
      <section className="space-y-4">
        <h3 className="type-section text-primary">Editar categoria</h3>
        <CategoryEditor category={selectedCategory} categories={categories} rows={rows} token={token}
          onBack={() => setManagingCategory(false)} onChanged={applyManagedCategory} />
      </section>
    )}
  </>);
}

export function CatalogEditor({ productId, token, onCancel, onChanged, categories, rows, onCategoryCreated, onCategoryChanged }: CategoryFields & {
  productId?: string;
  token: string;
  onCancel: () => void;
  onChanged: (id: string, row: CatalogRow | null) => void;
}) {
  const [row, setRow] = useState<CatalogRow | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!productId) return;
    const controller = new AbortController();
    getCatalogProduct(productId, token, controller.signal)
      .then(setRow)
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível abrir o produto.');
      });
    return () => controller.abort();
  }, [productId, token]);

  if (error) return <p role="alert" className="text-primary">{error}</p>;
  if (productId && !row) return <p role="status">A carregar produto…</p>;
  return (
    <ProductForm
      row={row}
      token={token}
      categories={categories}
      rows={rows}
      onCategoryCreated={onCategoryCreated}
      onCategoryChanged={onCategoryChanged}
      onCancel={onCancel}
      onSaved={saved => onChanged(saved.id, saved)}
      onDeleted={id => onChanged(id, null)}
    />
  );
}
