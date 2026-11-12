import { useState, type FormEvent } from 'react';
import { CATEGORIES } from '../config/constants';
import type { Product } from '../config/types';
import {
  catalogConfigured, imageUrl, listCatalog, redeemAdminLink, requestAdminRecovery, saveProduct, setAdminPassword,
  signIn, signOut, uploadProductImage, type CatalogRow,
} from '../features/products/catalogApi';
import type { AdminLinkType } from '../features/products/adminLink';
import { formatEuros } from '../features/checkout/order';

const primary = 'rounded-xl bg-primary px-4 py-3 text-center font-bold text-white disabled:opacity-50';
const secondary = 'rounded-xl border border-stone-300 px-4 py-3 font-semibold disabled:opacity-50';
const field = 'w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-base';
type Variant = { label: string; price: string; maxFlavors: string };
const parseList = (value: string) => [...new Set(value.split('\n').map(item => item.trim()).filter(Boolean))];
const searchText = (value: string) => value.trim().toLocaleLowerCase('pt-PT').normalize('NFD').replace(/\p{Diacritic}/gu, '');

function priceFrom(value: string) {
  const normalized = value.trim().replace(',', '.');
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(normalized)) throw new Error('Indique um preço válido com até duas casas decimais.');
  return Number(normalized);
}

function ProductForm({ row, token, onSaved, onCancel }: {
  row: CatalogRow | null;
  token: string;
  onSaved: (row: CatalogRow) => void;
  onCancel: () => void;
}) {
  const data = row?.details;
  const [productId] = useState(() => row?.id ?? crypto.randomUUID());
  const [category, setCategory] = useState(data?.category ?? CATEGORIES[0].name);
  const [variants, setVariants] = useState<Variant[]>((data?.variants ?? []).map(option => ({
    label: option.label,
    price: String(option.price),
    maxFlavors: option.maxFlavors == null ? '' : String(option.maxFlavors),
  })));
  const [image, setImage] = useState(data?.image ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  function updateVariant(index: number, value: Partial<Variant>) {
    setVariants(current => current.map((option, i) => i === index ? { ...option, ...value } : option));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
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
      const configurable = ['Bolos Temáticos', 'Brigadeiros', 'Salgados'].includes(category);
      const isThemedCake = category === 'Bolos Temáticos';
      const options = configurable ? variants.map(option => {
        const label = option.label.trim();
        if (!label) throw new Error('Indique o nome de cada opção.');
        const maxFlavors = option.maxFlavors === '' ? undefined : Number(option.maxFlavors);
        if (maxFlavors != null && (!Number.isInteger(maxFlavors) || maxFlavors < 1 || maxFlavors > 100)) {
          throw new Error('O limite de sabores deve estar entre 1 e 100.');
        }
        return { label, price: priceFrom(option.price), ...(maxFlavors == null ? {} : { maxFlavors }) };
      }) : [];
      if (new Set(options.map(option => option.label.toLowerCase())).size !== options.length) {
        throw new Error('Dê um nome diferente a cada opção.');
      }
      if (published && configurable && !options.length) throw new Error('Adicione pelo menos uma opção antes de publicar.');
      const price = options.length ? Math.min(...options.map(option => option.price)) : priceFrom(text('price') || '0');
      if (published && (price <= 0 || options.some(option => option.price <= 0))) throw new Error('Os preços publicados devem ser superiores a zero.');
      const tags = parseList(text('tags'));
      const flavors = configurable && !isThemedCake ? parseList(text('flavors')) : [];
      if (tags.length > 20 || flavors.length > 50 || [...tags, ...flavors].some(value => value.length > 80)) {
        throw new Error('Use até 20 tópicos e 50 sabores, com até 80 caracteres por linha.');
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
        ...data, name, description, category, price, tags, image: nextImage,
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

  const configurable = ['Bolos Temáticos', 'Brigadeiros', 'Salgados'].includes(category);

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-stone-200 bg-white p-4 sm:p-6">
      <h2 className="font-headline text-xl font-bold text-primary">{row ? 'Editar produto' : 'Novo produto'}</h2>
      <fieldset disabled={busy} className="space-y-4">
        <label className="block space-y-1"><span>Nome</span><input name="name" required maxLength={100} defaultValue={data?.name} className={field} /></label>
        <label className="block space-y-1"><span>Descrição</span><textarea name="description" rows={4} required maxLength={3000} defaultValue={data?.description} className={field} /></label>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-1">
            <span>Categoria</span>
            <select className={field} value={category} onChange={event => setCategory(event.target.value)}>
              {CATEGORIES.map(item => <option key={item.name}>{item.name}</option>)}
            </select>
          </label>
          {!configurable && <label className="block space-y-1"><span>Preço em euros</span><input name="price" inputMode="decimal" maxLength={9} required defaultValue={data?.price ?? ''} className={field} /></label>}
        </div>
        <label className="block space-y-1"><span>Tópicos (um por linha)</span><textarea name="tags" maxLength={1620} rows={3} defaultValue={data?.tags?.join('\n')} className={field} /></label>
        {configurable && (
          <div className="space-y-3 rounded-xl border border-stone-200 p-3">
            <h3 className="font-semibold">{category === 'Bolos Temáticos' ? 'Tamanhos e preços' : 'Opções e preços'}</h3>
            <p className="text-sm text-stone-600">O catálogo mostra o menor preço das opções.</p>
            {variants.map((option, index) => (
              <div key={index} className="grid gap-2 border-t border-stone-200 pt-3 sm:grid-cols-2">
                <label><span className="text-sm">Nome da opção</span><input className={field} maxLength={80} value={option.label} onChange={event => updateVariant(index, { label: event.target.value })} /></label>
                <label><span className="text-sm">Preço em euros</span><input className={field} inputMode="decimal" maxLength={9} value={option.price} onChange={event => updateVariant(index, { price: event.target.value })} /></label>
                {category !== 'Bolos Temáticos' && <label><span className="text-sm">Limite de sabores (opcional)</span><input className={field} inputMode="numeric" maxLength={3} value={option.maxFlavors} onChange={event => updateVariant(index, { maxFlavors: event.target.value })} /></label>}
                <button type="button" className={secondary} onClick={() => setVariants(current => current.filter((_, i) => i !== index))}>Remover opção</button>
              </div>
            ))}
            <button type="button" className={secondary} disabled={variants.length >= 20} onClick={() => setVariants(current => [...current, { label: '', price: '', maxFlavors: '' }])}>Adicionar opção</button>
            {category !== 'Bolos Temáticos' && <label className="block space-y-1"><span>Sabores (um por linha)</span><textarea name="flavors" maxLength={4050} rows={3} className={field} defaultValue={data?.flavors?.join('\n')} /></label>}
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
          <button className={secondary} type="button" onClick={onCancel}>Voltar à lista</button>
        </div>
      </fieldset>
    </form>
  );
}

export default function AdminScreen() {
  const [token, setToken] = useState('');
  const [rows, setRows] = useState<CatalogRow[]>([]);
  const [edit, setEdit] = useState<CatalogRow | 'new' | null>(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [passwordMode, setPasswordMode] = useState<AdminLinkType | null>(() =>
    new URLSearchParams(window.location.search).get('recuperar') === '1' ? 'recovery' : null
  );
  const [passwordSession, setPasswordSession] = useState('');
  const [recoveryNotice, setRecoveryNotice] = useState('');
  const recovering = passwordMode === 'recovery';
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<'all' | 'published' | 'draft'>('all');
  const published = rows.filter(row => row.published).length;
  const query = searchText(search);
  const visibleRows = rows.filter(row =>
    (status === 'all' || row.published === (status === 'published')) &&
    searchText(row.details.name + ' ' + row.details.category).includes(query)
  );

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const form = new FormData(event.currentTarget);
    try {
      const session = await signIn(String(form.get('email') ?? '').trim(), String(form.get('password') ?? ''));
      setRows(await listCatalog(session));
      setToken(session);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  function backToLogin() {
    const url = new URL(window.location.href);
    if (url.searchParams.has('recuperar')) {
      url.searchParams.delete('recuperar');
      window.history.replaceState(window.history.state, '', url);
    }
    setPasswordMode(null);
  }

  async function sendRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setRecoveryNotice('');
    const form = new FormData(event.currentTarget);
    try {
      await requestAdminRecovery(String(form.get('email') ?? '').trim());
      setRecoveryNotice('Confira a caixa de entrada do e-mail cadastrado.');
    } catch {
      setRecoveryNotice('Não foi possível solicitar outro e-mail agora. Aguarde e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy || !passwordMode) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('newPassword') ?? '');
    if (password.length < 12 || password !== form.get('confirmPassword')) {
      setError('Use pelo menos 12 caracteres e repita a mesma senha.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const session = passwordSession || await redeemAdminLink(String(form.get('accessLink') ?? ''), passwordMode);
      setPasswordSession(session);
      await setAdminPassword(session, password);
      setPasswordSession('');
      backToLogin();
      setNotice(recovering ? 'Senha redefinida. Entre com a nova senha.' : 'Acesso ativado. Entre com a senha que acabou de definir.');
      void signOut(session, recovering ? 'global' : 'local').catch(() => {});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível definir a senha.');
    } finally {
      setBusy(false);
    }
  }

  function logout() {
    void signOut(token).catch(() => {});
    setToken('');
    setRows([]);
    setEdit(null);
    setError('');
    setNotice('');
  }

  return (
    <main className="mx-auto min-h-screen max-w-3xl space-y-5 px-4 py-6 sm:px-8">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-stone-200 pb-4">
        <div><a href="/" className="text-sm font-semibold text-primary underline">Presente Doce</a><h1 className="font-headline text-2xl font-extrabold">Gestão do catálogo</h1></div>
        <div className="flex flex-wrap gap-2">
          <a href="/precificacao" className={secondary}>Precificação</a>
          {token && <button type="button" onClick={logout} className={secondary}>Sair</button>}
        </div>
      </header>
      {!catalogConfigured ? (
        <p role="status">A gestão do catálogo será disponibilizada quando a base de dados estiver ligada.</p>
      ) : !token ? (
        passwordMode ? (
          <section className="max-w-md space-y-4 rounded-2xl border border-stone-200 p-4 sm:p-6">
            <h2 className="font-headline text-lg font-bold">{recovering ? 'Redefinir senha' : 'Ativar acesso'}</h2>
            <form onSubmit={changePassword} className="space-y-4">
              {!passwordSession && (
                <>
                  <p className="text-sm text-stone-600">No e-mail {recovering ? 'de recuperação' : 'de convite'} do Supabase, copie o endereço do botão sem abrir o link. Cole-o aqui.</p>
                  <label className="block space-y-1"><span>{recovering ? 'Link do e-mail de recuperação' : 'Link de convite'}</span><input name="accessLink" type="password" required autoComplete="off" className={field} /></label>
                </>
              )}
              <label className="block space-y-1"><span>Nova senha (mínimo de 12 caracteres)</span><input name="newPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
              <label className="block space-y-1"><span>Confirmar nova senha</span><input name="confirmPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
              {error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>}
              <div className="flex flex-wrap gap-2">
                <button type="submit" className={primary} disabled={busy}>{busy ? 'A guardar…' : recovering ? 'Guardar nova senha' : 'Ativar conta'}</button>
                <button type="button" className={secondary} disabled={busy || !!passwordSession} onClick={() => { setError(''); backToLogin(); }}>Voltar</button>
              </div>
            </form>
            {recovering && !passwordSession && (
              <details className="border-t border-stone-200 pt-4">
                <summary className="cursor-pointer font-semibold text-primary">Ainda não recebeu o e-mail?</summary>
                <form onSubmit={sendRecovery} className="mt-3 space-y-3">
                  <label className="block space-y-1"><span>E-mail cadastrado</span><input name="email" type="email" required autoComplete="username" className={field} /></label>
                  <button type="submit" className={secondary} disabled={busy}>Enviar e-mail de recuperação</button>
                  {recoveryNotice && <p role="status" className="text-sm">{recoveryNotice}</p>}
                </form>
              </details>
            )}
          </section>
        ) : (
          <form onSubmit={login} className="max-w-md space-y-4 rounded-2xl border border-stone-200 p-4 sm:p-6">
            <label className="block space-y-1"><span>E-mail</span><input name="email" type="email" required autoComplete="username" className={field} /></label>
            <label className="block space-y-1"><span>Senha</span><input name="password" type="password" required autoComplete="current-password" className={field} /></label>
            {notice && <p role="status" className="text-sm font-semibold">{notice}</p>}
            {error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>}
            <div className="flex flex-wrap gap-2">
              <button type="submit" className={primary} disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
              <button type="button" className={secondary} disabled={busy} onClick={() => { setError(''); setPasswordMode('recovery'); }}>Esqueci a senha</button>
              <button type="button" className={secondary} disabled={busy} onClick={() => { setError(''); setPasswordMode('invite'); }}>Ativar acesso</button>
            </div>
          </form>
        )
      ) : edit ? (
        <ProductForm
          key={edit === 'new' ? 'new' : edit.id}
          row={edit === 'new' ? null : edit}
          token={token}
          onCancel={() => setEdit(null)}
          onSaved={row => {
            setRows(current => current.some(item => item.id === row.id)
              ? current.map(item => item.id === row.id ? row : item)
              : [...current, row]);
            setNotice(row.published ? 'Produto publicado no catálogo.' : 'Rascunho guardado.');
            setEdit(null);
          }}
        />
      ) : (
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-headline text-xl font-bold">Produtos</h2>
            <div className="flex flex-wrap gap-2">
              <button type="button" disabled={busy} className={secondary} onClick={async () => {
                setBusy(true);
                setError('');
                try { setRows(await listCatalog(token)); }
                catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível atualizar.'); }
                finally { setBusy(false); }
              }}>Atualizar lista</button>
              <button type="button" className={primary} onClick={() => setEdit('new')}>Novo produto</button>
            </div>
          </div>
          {notice && <p role="status" className="text-sm font-semibold">{notice}</p>}
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
          {!visibleRows.length && <p>{rows.length ? 'Nenhum produto corresponde aos filtros.' : 'Ainda não há produtos.'}</p>}
          <ul className="divide-y divide-stone-200">
            {visibleRows.map(row => (
              <li key={row.id} className="flex items-center gap-3 py-3">
                {row.details.image && <img src={imageUrl(row.details.image)} alt="" className="size-14 shrink-0 rounded-lg object-cover" />}
                <div className="min-w-0 flex-1">
                  <p className="break-words font-semibold">{row.details.name}</p>
                  <p className="text-sm text-stone-600">{row.details.category} · {formatEuros(row.details.price)} · {row.published ? 'Publicado' : 'Rascunho'}</p>
                </div>
                <button type="button" aria-label={'Editar ' + row.details.name} className={secondary} onClick={() => setEdit(row)}>Editar</button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
