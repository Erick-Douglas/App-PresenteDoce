import { useState, type FormEvent } from 'react';
import { Field, Panel } from '../components/ModuleUI';
import { request } from '../features/products/catalogApi';
export function OnboardingScreen() {
  const callback = new URLSearchParams(window.location.hash.slice(1));
  const [token, setToken] = useState(() => {
    const t = callback.get('access_token') || '';
    if (t) window.history.replaceState(null, '', '/criar-loja');
    return t;
  });
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState(''),
    [notice, setNotice] = useState(''),
    [created, setCreated] = useState('');
  async function auth(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    setNotice('');
    const f = new FormData(e.currentTarget);
    try {
      const path = register
        ? '/auth/v1/signup?redirect_to=' +
          encodeURIComponent(window.location.origin + '/criar-loja')
        : '/auth/v1/token?grant_type=password';
      const r = await request<{ access_token?: string }>(path, {
        method: 'POST',
        body: JSON.stringify({
          email: f.get('email'),
          password: f.get('password'),
        }),
      });
      if (r.access_token) setToken(r.access_token);
      else
        setNotice(
          'Confirme o e-mail recebido e volte a esta página para entrar.',
        );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }
  async function create(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBusy(true);
    setError('');
    const f = new FormData(e.currentTarget);
    try {
      const slug = String(f.get('slug'));
      await request(
        '/rest/v1/rpc/create_store',
        {
          method: 'POST',
          body: JSON.stringify({ p_name: f.get('name'), p_slug: slug }),
        },
        token,
      );
      setCreated(slug);
      setToken('');
    } catch (e) {
      setError(
        e instanceof Error ? e.message : 'Não foi possível criar a loja.',
      );
    } finally {
      setBusy(false);
    }
  }
  if (import.meta.env.VITE_ENABLE_ONBOARDING !== 'true')
    return (
      <main className="page-width max-w-2xl py-12 space-y-4">
        <h1 className="type-page">Sua loja, em breve</h1>
        <p className="text-muted">
          O cadastro de novas lojas será disponibilizado na próxima etapa da
          plataforma.
        </p>
        <a className="ui-secondary" href="/">
          Voltar à vitrine
        </a>
      </main>
    );
  return (
    <main className="page-width max-w-2xl py-10 space-y-6">
      <div>
        <p className="text-sm text-primary">Sua confeitaria, organizada</p>
        <h1 className="type-page mt-2">Criar a sua loja</h1>
        <p className="text-sm text-muted mt-3">
          1. Conta · 2. Loja · 3. Configuração
        </p>
      </div>
      {created ? (
        <Panel title="Sua loja está pronta">
          <p>
            Configure a marca, os contactos, a capacidade e o catálogo antes de
            partilhar o endereço com clientes.
          </p>
          <a
            className="ui-primary inline-flex mt-4"
            href={'/lojas/' + created + '#store-settings'}
          >
            Configurar a loja
          </a>
        </Panel>
      ) : token ? (
        <Panel title="2. Identidade da loja">
          <form className="admin-form" onSubmit={create}>
            <fieldset className="admin-form" disabled={busy}>
              <Field
                label="Nome da loja"
                name="name"
                required
                maxLength={100}
              />
              <Field
                label="Endereço da loja"
                name="slug"
                required
                pattern="[a-z0-9][a-z0-9-]{2,49}"
                maxLength={50}
                placeholder="minha-confeitaria"
              />
              <p className="text-sm text-muted">
                Use letras minúsculas, números e hífens. Será o endereço
                /lojas/minha-confeitaria.
              </p>
              <button className="ui-primary" type="submit">
                {busy ? 'A criar…' : 'Criar loja em avaliação'}
              </button>
            </fieldset>
          </form>
          <p className="text-sm text-muted mt-3">
            Avaliação de 14 dias. A contratação por assinatura será
            disponibilizada numa próxima etapa; não há cobrança nesta página.
          </p>
        </Panel>
      ) : (
        <Panel
          title={register ? '1. Criar conta' : '1. Entrar com a sua conta'}
        >
          <form className="admin-form" onSubmit={auth}>
            <fieldset className="admin-form" disabled={busy}>
              <Field
                label="E-mail"
                name="email"
                type="email"
                autoComplete="email"
                required
              />
              <Field
                label="Palavra-passe"
                name="password"
                type="password"
                autoComplete={register ? 'new-password' : 'current-password'}
                required
                minLength={register ? 12 : 1}
              />
              <button className="ui-primary" type="submit">
                {busy ? 'A verificar…' : register ? 'Criar conta' : 'Entrar'}
              </button>
              <button
                type="button"
                className="ui-quiet-action"
                onClick={() => setRegister(!register)}
              >
                {register ? 'Já tenho uma conta' : 'Criar uma conta'}
              </button>
            </fieldset>
          </form>
        </Panel>
      )}
      {notice && <p role="status">{notice}</p>}
      {error && (
        <p role="alert" className="module-error">
          {error}
        </p>
      )}
      <a href="/" className="ui-quiet-action">
        Voltar à vitrine
      </a>
    </main>
  );
}
