import { useEffect, useState, type FormEvent } from 'react';
import { THEMED_CAKE_SIZES } from '../config/constants';
import type { CatalogCategory, Product } from '../config/types';
import {
  createCatalogCategory, deleteProduct, getCatalogProduct, imageUrl, listCatalog, saveProduct, uploadProductImage, type CatalogRow,
} from '../features/products/catalogApi';
import { formatCatalogPrice, parseCatalogPrice } from '../features/products/catalogFields';
import { currencySymbol, formatEuros } from '../features/checkout/order';

const primary = 'rounded-xl bg-primary px-4 py-3 text-center font-bold text-white disabled:opacity-50';
const secondary = 'rounded-xl border border-stone-300 px-4 py-3 font-semibold disabled:opacity-50';
const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base';
const chip = 'rounded-full border border-primary/15 px-3 py-1.5 text-sm text-primary';
type Variant = { label: string; price: string; maxFlavors: string };
const optionFields = new Map([
  ['Bolos Temáticos', { title: 'Tamanhos do bolo', label: 'Tamanho', example: 'Pequeno (1,5 kg)', add: 'Adicionar tamanho' }],
  ['Brigadeiros', { title: 'Tamanhos da caixa', label: 'Caixa', example: 'Caixa com 12', add: 'Adicionar caixa' }],
  ['Salgados', { title: 'Quantidades disponíveis', label: 'Quantidade', example: '25 unidades', add: 'Adicionar quantidade' }],
]);
const parseList = (value: string) => [...new Set(value.split('\n').map(item => item.trim()).filter(Boolean))];
const searchText = (value: string) => value.trim().toLocaleLowerCase('pt-PT').normalize('NFD').replace(/\p{Diacritic}/gu, '');

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
        <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-stone-500">{currencySymbol}</span>
      </span>
    </label>
  );
}

type CategoryFields = {
  categories: CatalogCategory[];
  products: Product[];
  onCategoryCreated: (name: string) => void;
};

function ProductForm({ row, token, onSaved, onDeleted, onCancel, categories, products, onCategoryCreated }: CategoryFields & {
  row: CatalogRow | null;
  token: string;
  onSaved: (row: CatalogRow) => void;
  onDeleted: (id: string) => void;
  onCancel: () => void;
}) {
  const data = row?.details;
  const [productId] = useState(() => row?.id ?? crypto.randomUUID());
  const [category, setCategory] = useState(data?.category ?? categories[0]?.name ?? '');
  const [categoryDraft, setCategoryDraft] = useState<string | null>(null);
  const [categoryError, setCategoryError] = useState('');
  const [creatingCategory, setCreatingCategory] = useState(false);
  const [price, setPrice] = useState(data ? formatCatalogPrice(data.price) : '');
  const [tags, setTags] = useState(data?.tags ?? []);
  const [topic, setTopic] = useState('');
  const [topicError, setTopicError] = useState('');
  const [variantDrafts, setVariantDrafts] = useState<Record<string, Variant[]>>(() => {
    if (!data) return {};
    const savedOptions = data.variants ?? [];
    const options: NonNullable<Product['variants']> =
      !savedOptions.length && data.category === 'Bolos Temáticos' && row?.published ? THEMED_CAKE_SIZES : savedOptions;
    return { [data.category]: options.map(option => ({
      label: option.label,
      price: formatCatalogPrice(option.price),
      maxFlavors: option.maxFlavors == null ? '' : String(option.maxFlavors),
    })) };
  });
  const [flavorDrafts, setFlavorDrafts] = useState(() => new Map(data ? [[data.category, data.flavors?.join('\n') ?? '']] : []));
  const [image, setImage] = useState(data?.image ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const optionFieldsForCategory = optionFields.get(category);
  const isThemedCake = category === 'Bolos Temáticos';
  const variants = optionFieldsForCategory ? variantDrafts[category] ?? [] : [];
  const optionPrices = variants.map(option => parseCatalogPrice(option.price));
  const lowestPrice = optionPrices.length && optionPrices.every(value => value !== null)
    ? Math.min(...optionPrices) : null;
  const suggestedTopics = new Map<string, string>();
  for (const product of products) {
    if (product.category !== category) continue;
    for (const item of product.tags ?? []) {
      const key = searchText(item);
      if (key && !suggestedTopics.has(key)) suggestedTopics.set(key, item.trim());
    }
  }
  const selectedTopicKeys = new Set(tags.map(searchText));
  const availableTopics = [...suggestedTopics].filter(([key]) => !selectedTopicKeys.has(key));

  async function addCategory() {
    if (busy || creatingCategory) return;
    const name = (categoryDraft ?? '').normalize('NFC').trim().replace(/\s+/g, ' ');
    setCategoryError('');
    if (!name || name.length > 60 || name.toLocaleLowerCase('pt-PT') === 'all') {
      setCategoryError('Escreva um nome de categoria válido com até 60 caracteres.');
      return;
    }
    const existing = categories.find(item => item.name.toLocaleLowerCase('pt-PT') === name.toLocaleLowerCase('pt-PT'));
    if (existing) {
      setCategory(existing.name);
      setCategoryDraft(null);
      return;
    }
    setCreatingCategory(true);
    try {
      const created = await createCatalogCategory(name, token);
      onCategoryCreated(created.name);
      setCategory(created.name);
      setCategoryDraft(null);
    } catch (cause) {
      setCategoryError(cause instanceof Error ? cause.message : 'Não foi possível criar a categoria.');
    } finally {
      setCreatingCategory(false);
    }
  }

  function tagsWith(value: string) {
    const key = searchText(value);
    if (!key || selectedTopicKeys.has(key)) return tags;
    if (tags.length >= 20 || value.trim().length > 80) throw new Error('Use até 20 tópicos, com até 80 caracteres cada.');
    return [...tags, suggestedTopics.get(key) ?? value.trim()];
  }

  function addTopic(value: string) {
    setTopicError('');
    try {
      setTags(tagsWith(value));
      setTopic('');
    } catch (cause) {
      setTopicError(cause instanceof Error ? cause.message : 'Não foi possível adicionar o tópico.');
    }
  }

  async function remove() {
    if (!row || busy) return;
    setBusy(true);
    setError('');
    try {
      await deleteProduct(row, token);
      onDeleted(row.id);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível excluir o produto.');
    } finally {
      setBusy(false);
    }
  }

  function setVariants(next: Variant[]) {
    setVariantDrafts(current => ({ ...current, [category]: next }));
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
      if (!category) throw new Error('Escolha uma categoria.');
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
      const topics = tagsWith(topic);
      const flavors = configurable && !isThemedCake ? parseList(flavorDrafts.get(category) ?? '') : [];
      if (topics.length > 20 || flavors.length > 50 || [...topics, ...flavors].some(value => value.length > 80)) {
        throw new Error('Use até 20 tópicos e 50 opções de sabor, com até 80 caracteres cada.');
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
        ...data, name, description, category, price: productPrice, tags: topics, image: nextImage,
        configuravel: configurable,
        simples: !configurable,
        variants: options.length ? options : undefined,
        flavors: flavors.length ? flavors : undefined,
      };
      const saved = await saveProduct({ id: productId, details, published }, row?.version ?? null, token);
      onSaved(saved);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível guardar.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <fieldset disabled={busy || creatingCategory} className="space-y-4">
        <label className="block space-y-1"><span>Nome</span><input name="name" required maxLength={100} defaultValue={data?.name} className={field} /></label>
        <label className="block space-y-1"><span>Descrição</span><textarea name="description" rows={2} required maxLength={3000} defaultValue={data?.description} className={field + ' resize-y'} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span>Categoria</span>
            <select className={field} value={category} onChange={event => setCategory(event.target.value)} required>
              {category && !categories.some(item => item.name === category) && <option>{category}</option>}
              {categories.map(item => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          {!optionFieldsForCategory && <PriceInput label="Preço" value={price} onChange={setPrice} required />}
        </div>
        {categoryDraft === null ? (
          <button type="button" className="text-sm font-bold text-primary underline underline-offset-4"
            onClick={() => setCategoryDraft('')}>Criar categoria</button>
        ) : (
          <div className="space-y-2 rounded-xl border border-stone-200 p-3">
            <label className="block space-y-1">
              <span>Nome da categoria</span>
              <input value={categoryDraft} maxLength={60} className={field} onChange={event => setCategoryDraft(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); void addCategory(); }
                }} />
            </label>
            {categoryError && <p role="alert" className="text-sm font-semibold text-primary">{categoryError}</p>}
            <div className="flex flex-wrap gap-2">
              <button className={primary} type="button" onClick={addCategory}>{creatingCategory ? 'A criar…' : 'Criar e selecionar'}</button>
              <button className={secondary} type="button" onClick={() => { setCategoryDraft(null); setCategoryError(''); }}>Cancelar</button>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <label className="block space-y-1">
            <span>Tópicos</span>
            <input value={topic} maxLength={80} className={field} placeholder="Ex. Chocolate"
              onChange={event => setTopic(event.target.value)} onKeyDown={event => {
                if (event.key === 'Enter' && !event.nativeEvent.isComposing) { event.preventDefault(); addTopic(topic); }
              }} />
          </label>
          <button type="button" className="text-sm font-bold text-primary underline underline-offset-4 disabled:opacity-50"
            disabled={!topic.trim()} onClick={() => addTopic(topic)}>Adicionar tópico</button>
          {topicError && <p role="alert" className="text-sm font-semibold text-primary">{topicError}</p>}
          {!!tags.length && <ul aria-label="Tópicos do produto" className="flex flex-wrap gap-2">
            {tags.map((tag, index) => (
              <li key={index}><button type="button" aria-label={'Remover tópico ' + tag} className={chip + ' bg-primary/5'}
                onClick={() => { setTags(current => current.filter((_, i) => i !== index)); setTopicError(''); }}>{tag} ×</button></li>
            ))}
          </ul>}
          {!!availableTopics.length && <div className="space-y-1.5">
            <p className="text-sm text-stone-600">Usados em {category}</p>
            <div className="flex flex-wrap gap-2">
              {availableTopics.map(([key, value]) => (
                <button key={key} type="button" className={chip} onClick={() => addTopic(value)}>+ {value}</button>
              ))}
            </div>
          </div>}
        </div>
        {optionFieldsForCategory && (
          <div className="space-y-3 rounded-xl border border-stone-200 p-3">
            <h3 className="font-semibold">{optionFieldsForCategory.title}</h3>
            <p className="text-sm text-stone-600">O cliente escolhe uma opção ao encomendar. Indique o preço total de cada opção.</p>
            <p className="text-sm text-stone-600">{lowestPrice === null ? 'O card mostra o preço da opção mais barata.' : <>No card <strong>A partir de {formatEuros(lowestPrice)}</strong></>}</p>
            {variants.map((option, index) => (
              <div key={index} className="grid gap-2 border-t border-stone-200 pt-3 sm:grid-cols-2">
                <label><span>{optionFieldsForCategory.label}</span><input className={field} maxLength={80} placeholder={optionFieldsForCategory.example}
                  value={option.label} onChange={event => updateVariant(index, { label: event.target.value })} required /></label>
                <PriceInput label="Preço da opção" value={option.price} onChange={value => updateVariant(index, { price: value })} required />
                {!isThemedCake && <label><span className="text-sm">Máximo de sabores à escolha (opcional)</span><input className={field} inputMode="numeric" maxLength={3}
                  placeholder="Sem limite" value={option.maxFlavors} onChange={event => updateVariant(index, { maxFlavors: event.target.value })} /></label>}
                <button type="button" className="justify-self-start text-sm font-semibold text-primary underline underline-offset-4"
                  onClick={() => setVariants(variants.filter((_, i) => i !== index))}>Remover opção</button>
              </div>
            ))}
            <button type="button" className={secondary} disabled={variants.length >= 20}
              onClick={() => setVariants([...variants, { label: '', price: '', maxFlavors: '' }])}>{optionFieldsForCategory.add}</button>
            {!isThemedCake && <label className="block space-y-1">
              <span>{category === 'Salgados' ? 'Tipos de salgado (um por linha)' : 'Sabores da caixa (um por linha)'}</span>
              <textarea maxLength={4050} rows={2} className={field} value={flavorDrafts.get(category) ?? ''}
                onChange={event => {
                  const value = event.target.value;
                  setFlavorDrafts(current => new Map(current).set(category, value));
                }} />
            </label>}
          </div>
        )}
        <div className="space-y-2">
          {image && <img src={imageUrl(image)} alt="Imagem atual do produto" className="h-28 w-36 rounded-xl object-cover" />}
          <label className="block space-y-1"><span>Imagem (JPG, PNG ou WebP até 5 MB)</span><input name="image" type="file" accept="image/jpeg,image/png,image/webp" className={field} /></label>
        </div>
        <label className="flex items-center gap-3"><input name="published" type="checkbox" defaultChecked={row?.published} className="size-5 accent-primary" /> Mostrar no catálogo público</label>
        {error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>}
        <div className="flex flex-col gap-2 sm:flex-row">
          <button className={primary} type="submit">{busy ? 'A guardar…' : 'Guardar produto'}</button>
          <button className={secondary} type="button" onClick={onCancel}>Voltar</button>
          {row && !confirmDelete && <button className="rounded-xl px-4 py-3 font-semibold text-primary underline" type="button" onClick={() => setConfirmDelete(true)}>Excluir produto</button>}
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
  );
}

export function CatalogEditor({ productId, token, onCancel, onChanged, categories, products, onCategoryCreated }: CategoryFields & {
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
      products={products}
      onCategoryCreated={onCategoryCreated}
      onCancel={onCancel}
      onSaved={saved => onChanged(saved.id, saved)}
      onDeleted={id => onChanged(id, null)}
    />
  );
}

export function CatalogManagement({ token, onNew, onEdit }: {
  token: string;
  onNew: () => void;
  onEdit: (id: string) => void;
}) {
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(true);
  const [attempt, setAttempt] = useState(0);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const published = rows.filter(row => row.published).length;
  const query = searchText(search);
  const visibleRows = rows.filter(row =>
    (status === 'all' || row.published === (status === 'published')) &&
    searchText(row.details.name + ' ' + row.details.category).includes(query)
  );

  useEffect(() => {
    const controller = new AbortController();
    setBusy(true);
    setError('');
    listCatalog(token, controller.signal)
      .then(setRows)
      .catch(cause => {
        if (!controller.signal.aborted) setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar.');
      })
      .finally(() => { if (!controller.signal.aborted) setBusy(false); });
    return () => controller.abort();
  }, [token, attempt]);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-headline text-xl font-bold">Produtos</h2>
        <div className="flex flex-wrap gap-2">
          <button type="button" disabled={busy} className={secondary} onClick={() => setAttempt(value => value + 1)}>Atualizar lista</button>
          <button type="button" className={primary} onClick={onNew}>Novo produto</button>
        </div>
      </div>
      {busy && <p role="status">A carregar produtos…</p>}
      {error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>}
      <dl className="grid grid-cols-3 gap-2 rounded-xl bg-stone-50 p-3 text-sm">
        <div><dt>Total</dt><dd className="font-bold">{rows.length}</dd></div>
        <div><dt>Publicados</dt><dd className="font-bold">{published}</dd></div>
        <div><dt>Rascunhos</dt><dd className="font-bold">{rows.length - published}</dd></div>
      </dl>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block space-y-1"><span>Pesquisar nome ou categoria</span><input type="search" value={search} onChange={event => setSearch(event.target.value)} className={field} /></label>
        <label className="block space-y-1"><span>Estado</span><select value={status} onChange={event => setStatus(event.target.value as typeof status)} className={field}><option value="all">Todos</option><option value="published">Publicados</option><option value="draft">Rascunhos</option></select></label>
      </div>
      {!busy && !error && !visibleRows.length && <p>{rows.length ? 'Nenhum produto corresponde aos filtros.' : 'Ainda não há produtos.'}</p>}
      <ul className="divide-y divide-stone-200">
        {visibleRows.map(row => (
          <li key={row.id} className="flex items-center gap-3 py-3">
            {row.details.image && <img src={imageUrl(row.details.image)} alt="" className="size-14 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0 flex-1">
              <p className="break-words font-semibold">{row.details.name}</p>
              <p className="text-sm text-stone-600">{row.details.category} · {formatEuros(row.details.price)} · {row.published ? 'Publicado' : 'Rascunho'}</p>
            </div>
            <button type="button" aria-label={'Editar ' + row.details.name} className={secondary} onClick={() => onEdit(row.id)}>Editar</button>
          </li>
        ))}
      </ul>
    </section>
  );
}
