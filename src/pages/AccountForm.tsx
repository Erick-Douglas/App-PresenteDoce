import { useEffect, useRef, useState, type FormEvent } from 'react';
import { BUSINESS_INFO } from '../config/constants';
import type { RecoveryCallback } from '../features/products/adminLink';
import {
  catalogConfigured, redeemManualRecoveryLink, requestAdminRecovery, setAdminPassword,
  signIn, signOut, type CatalogSession,
} from '../features/products/catalogApi';

const recoveryUrl = new URL('/admin?recuperar=1', BUSINESS_INFO.website).href;
const directRecovery = import.meta.env.VITE_DIRECT_RECOVERY === 'true';
const primary = 'min-h-11 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-white hover:bg-primary/90 disabled:opacity-50';
const secondary = 'min-h-11 w-fit rounded-lg px-1 text-sm font-semibold text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary disabled:opacity-50';
const field = 'mt-1 block w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-base focus:border-primary focus:outline-2 focus:outline-primary/40';
const label = 'block text-sm font-semibold text-stone-700';

type Step = 'login' | 'request' | 'sent' | 'manual' | 'reset';

export default function AccountForm({ initialRecovery, callback, onLogin, onRecoveryComplete }: {
  initialRecovery: boolean;
  callback: RecoveryCallback | null;
  onLogin: (session: CatalogSession) => void;
  onRecoveryComplete: () => void;
}) {
  const callbackToken = callback && 'token' in callback ? callback.token : '';
  const [step, setStep] = useState<Step>(() => callbackToken ? 'reset' : (initialRecovery || callback) ? 'request' : 'login');
  const [recoveryToken, setRecoveryToken] = useState(callbackToken);
  const [email, setEmail] = useState('');
  const [error, setError] = useState(callback && 'invalid' in callback ? 'Este link expirou ou já foi usado. Peça outro e-mail.' : '');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const active = useRef(false);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  function show(next: Step) {
    setError('');
    setNotice('');
    setStep(next);
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    const password = new FormData(event.currentTarget).get('password');
    try {
      const session = await signIn(email.trim(), String(password ?? ''));
      if (active.current) onLogin(session);
      else void signOut(session.token).catch(() => {});
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    } finally {
      setBusy(false);
    }
  }

  async function sendRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError('');
    try {
      await requestAdminRecovery(email.trim(), recoveryUrl);
      show('sent');
    } catch {
      setError('Não foi possível pedir outro e-mail agora. Aguarde e tente novamente.');
    } finally {
      setBusy(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const form = new FormData(event.currentTarget);
    const password = String(form.get('newPassword') ?? '');
    if (password.length < 12 || password !== form.get('confirmPassword')) {
      setError('Use pelo menos 12 caracteres e repita a mesma senha.');
      return;
    }
    setBusy(true);
    setError('');
    try {
      const token = recoveryToken || await redeemManualRecoveryLink(String(form.get('accessLink') ?? ''));
      setRecoveryToken(token);
      await setAdminPassword(token, password);
      await signOut(token, 'global').catch(() => {});
      setRecoveryToken('');
      onRecoveryComplete();
      show('login');
      setNotice('Senha redefinida. Entre com a nova senha.');
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível definir a senha.');
    } finally {
      setBusy(false);
    }
  }

  function restartRecovery() {
    if (recoveryToken) void signOut(recoveryToken).catch(() => {});
    setRecoveryToken('');
    onRecoveryComplete();
    show('request');
  }

  const emailField = (
    <label className={label}>
      E-mail
      <input name="email" type="email" required autoComplete="username" value={email} onChange={event => setEmail(event.target.value)} className={field} />
    </label>
  );
  const feedback = error && <p role="alert" className="text-sm font-semibold text-primary">{error}</p>;

  if (!catalogConfigured) return <p role="status">O acesso fica disponível quando a base de dados estiver ligada.</p>;

  if (step === 'request') return (
    <form onSubmit={sendRecovery} className="space-y-4">
      <p className="text-sm text-stone-600">Indique o e-mail da sua conta para receber um link de recuperação.</p>
      {emailField}
      {feedback}
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="submit" className={primary} disabled={busy}>{busy ? 'A enviar…' : 'Enviar link'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => show('login')}>Voltar a entrar</button>
      </div>
    </form>
  );

  if (step === 'sent') return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-stone-800">Confira o seu e-mail</h3>
      <p role="status" className="text-sm leading-relaxed text-stone-600">
        {directRecovery
          ? 'Se o endereço estiver cadastrado, abra o botão do e-mail para escolher a nova senha.'
          : 'Se o endereço estiver cadastrado, você receberá um e-mail. Use a recuperação manual com o endereço do botão.'}
      </p>
      <div className="flex flex-wrap items-center gap-x-4">
        {!directRecovery && <button type="button" className={secondary} onClick={() => show('manual')}>Usar link manualmente</button>}
        <button type="button" className={secondary} onClick={() => show('login')}>Voltar a entrar</button>
      </div>
    </section>
  );

  if (step === 'reset' || step === 'manual') return (
    <form onSubmit={changePassword} className="space-y-4">
      <h3 className="text-sm font-bold text-stone-800">Escolha uma nova senha</h3>
      {step === 'manual' && !recoveryToken && (
        <>
          <p className="text-sm text-stone-600">Copie o endereço do botão do e-mail e cole-o aqui antes de o abrir.</p>
          <label className={label}>Link de recuperação<input name="accessLink" type="password" required autoComplete="off" className={field} /></label>
        </>
      )}
      <label className={label}>Nova senha<input name="newPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
      <label className={label}>Confirmar senha<input name="confirmPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
      <p className="text-xs text-stone-600">Use pelo menos 12 caracteres.</p>
      {feedback}
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="submit" className={primary} disabled={busy}>{busy ? 'A guardar…' : 'Guardar senha'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={restartRecovery}>Pedir novo link</button>
      </div>
    </form>
  );

  return (
    <form onSubmit={login} className="space-y-4">
      {emailField}
      <label className={label}>Senha<input name="password" type="password" required autoComplete="current-password" className={field} /></label>
      {notice && <p role="status" className="text-sm text-stone-700">{notice}</p>}
      {feedback}
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="submit" className={primary} disabled={busy}>{busy ? 'A entrar…' : 'Entrar'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => show('request')}>Esqueci a senha</button>
      </div>
    </form>
  );
}
