import { useEffect, useRef, useState, type FormEvent } from 'react';
import { AuthChallenge, challengeSiteKey } from '../components/AuthChallenge';
import { BUSINESS_INFO } from '../config/constants';
import type { RecoveryCallback } from '../features/products/adminLink';
import { AuthRateLimitError } from '../features/products/authRateLimit';
import {
  catalogConfigured, redeemManualRecoveryLink, requestAdminRecovery, setAdminPassword,
  signIn, signOut, type CatalogSession,
} from '../features/products/catalogApi';

const recoveryUrl = new URL('/admin?recuperar=1', BUSINESS_INFO.website).href;
const directRecovery = import.meta.env.VITE_DIRECT_RECOVERY === 'true';
const primary = 'min-h-11 rounded-xl bg-primary px-4 py-2.5 text-center text-sm font-bold text-on-strong hover:bg-primary/90 disabled:opacity-50';
const secondary = 'min-h-11 w-fit rounded-lg px-1 text-sm font-bold text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary disabled:opacity-50';
const field = 'mt-1 block w-full rounded-xl border border-outline-strong bg-surface px-3 py-2.5 text-base focus:border-primary focus:outline-2 focus:outline-primary/40';
const label = 'block text-sm font-bold text-on-surface';

type Step = 'login' | 'request' | 'sent' | 'manual' | 'reset';
type AuthStep = 'login' | 'request';

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
  const [captchaToken, setCaptchaToken] = useState('');
  const [challengeVersion, setChallengeVersion] = useState(0);
  const [blocked, setBlocked] = useState<Record<AuthStep, number>>({ login: 0, request: 0 });
  const [now, setNow] = useState(Date.now);
  const authInFlight = useRef(false);
  const active = useRef(false);
  const authStep: AuthStep = step === 'request' ? 'request' : 'login';
  const retrySeconds = Math.max(0, Math.ceil((blocked[authStep] - now) / 1000));
  const submitDisabled = busy || retrySeconds > 0 || Boolean(challengeSiteKey && !captchaToken);

  useEffect(() => {
    active.current = true;
    return () => { active.current = false; };
  }, []);

  useEffect(() => {
    const until = Math.max(blocked.login, blocked.request);
    if (until <= now) return;
    const timer = window.setTimeout(() => setNow(Date.now()), Math.min(1000, until - now));
    return () => window.clearTimeout(timer);
  }, [blocked, now]);

  function rotateChallenge() {
    setCaptchaToken('');
    setChallengeVersion(value => value + 1);
  }

  function applyRateLimit(cause: unknown, operation: AuthStep) {
    if (!(cause instanceof AuthRateLimitError)) return false;
    const timestamp = Date.now();
    setNow(timestamp);
    setBlocked(current => ({ ...current, [operation]: timestamp + cause.retryAfter * 1000 }));
    setError(cause.message);
    return true;
  }

  function show(next: Step) {
    setError('');
    setNotice('');
    setStep(next);
    setCaptchaToken('');
  }

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled || authInFlight.current) return;
    authInFlight.current = true;
    setBusy(true);
    setError('');
    const password = new FormData(event.currentTarget).get('password');
    try {
      const session = await signIn(email.trim(), String(password ?? ''), captchaToken);
      if (active.current) onLogin(session);
      else void signOut(session.token).catch(() => {});
    } catch (cause) {
      if (!applyRateLimit(cause, 'login')) setError(cause instanceof Error ? cause.message : 'Não foi possível entrar.');
    } finally {
      authInFlight.current = false;
      rotateChallenge();
      setBusy(false);
    }
  }

  async function sendRecovery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitDisabled || authInFlight.current) return;
    authInFlight.current = true;
    setBusy(true);
    setError('');
    try {
      await requestAdminRecovery(email.trim(), recoveryUrl, captchaToken);
      show('sent');
    } catch (cause) {
      if (!applyRateLimit(cause, 'request')) setError('Não foi possível pedir outro e-mail agora. Aguarde e tente novamente.');
    } finally {
      authInFlight.current = false;
      rotateChallenge();
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
  const feedback = error && <p role="alert" className="text-sm font-bold text-primary">{error}</p>;
  const authCheck = <>
    {retrySeconds === 0 && <AuthChallenge key={authStep + ':' + challengeVersion} onToken={setCaptchaToken} />}
    {retrySeconds > 0 && <p className="text-sm text-on-surface">Nova tentativa em {retrySeconds} s.</p>}
  </>;

  if (!catalogConfigured) return <p role="status">O acesso fica disponível quando a base de dados estiver ligada.</p>;

  if (step === 'request') return (
    <form onSubmit={sendRecovery} className="space-y-4">
      <p className="text-sm text-muted">Indique o e-mail da sua conta para receber um link de recuperação.</p>
      {emailField}
      {feedback}
      {authCheck}
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="submit" className={primary} disabled={submitDisabled}>{busy ? 'A enviar…' : 'Enviar link'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => show('login')}>Voltar a entrar</button>
      </div>
    </form>
  );

  if (step === 'sent') return (
    <section className="space-y-3">
      <h3 className="type-item text-on-surface">Confira o seu e-mail</h3>
      <p role="status" className="text-sm leading-relaxed text-muted">
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
      <h3 className="type-item text-on-surface">Escolha uma nova senha</h3>
      {step === 'manual' && !recoveryToken && (
        <>
          <p className="text-sm text-muted">Copie o endereço do botão do e-mail e cole-o aqui antes de o abrir.</p>
          <label className={label}>Link de recuperação<input name="accessLink" type="password" required autoComplete="off" className={field} /></label>
        </>
      )}
      <label className={label}>Nova senha<input name="newPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
      <label className={label}>Confirmar senha<input name="confirmPassword" type="password" required minLength={12} maxLength={64} autoComplete="new-password" className={field} /></label>
      <p className="text-xs text-muted">Use pelo menos 12 caracteres.</p>
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
      {notice && <p role="status" className="text-sm text-on-surface">{notice}</p>}
      {feedback}
      {authCheck}
      <div className="flex flex-wrap items-center gap-x-4">
        <button type="submit" className={primary} disabled={submitDisabled}>{busy ? 'A entrar…' : 'Entrar'}</button>
        <button type="button" className={secondary} disabled={busy} onClick={() => show('request')}>Esqueci a senha</button>
      </div>
    </form>
  );
}
