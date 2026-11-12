import { useEffect, useRef, useState } from 'react';

export const challengeSiteKey = String(import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '').trim();

interface Turnstile {
  render(target: HTMLElement, options: {
    sitekey: string;
    appearance: 'interaction-only';
    size: 'compact' | 'flexible';
    callback: (token: string) => void;
    'expired-callback': () => void;
    'error-callback': () => void;
  }): string;
  remove(widget: string): void;
}

type TurnstileWindow = Window & { turnstile?: Turnstile };
let loading: Promise<Turnstile> | undefined;

function loadWidget() {
  const host = window as TurnstileWindow;
  if (host.turnstile) return Promise.resolve(host.turnstile);
  if (!loading) {
    loading = new Promise<Turnstile>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      const fail = () => {
        window.clearTimeout(timeout);
        script.remove();
        reject(new Error('Turnstile unavailable'));
      };
      const timeout = window.setTimeout(fail, 12000);
      script.onload = () => {
        window.clearTimeout(timeout);
        if (host.turnstile) resolve(host.turnstile);
        else fail();
      };
      script.onerror = fail;
      document.head.append(script);
    }).catch(error => {
      loading = undefined;
      throw error;
    });
  }
  return loading;
}

export function AuthChallenge({ onToken }: { onToken: (token: string) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);
  const [retry, setRetry] = useState(0);

  useEffect(() => {
    if (!challengeSiteKey) return;
    let active = true;
    let cleanup: (() => void) | undefined;
    const fail = () => {
      if (!active) return;
      onToken('');
      setFailed(true);
    };
    loadWidget().then(api => {
      if (!active || !container.current) return;
      const widget = api.render(container.current, {
        sitekey: challengeSiteKey,
        appearance: 'interaction-only',
        size: window.innerWidth < 380 ? 'compact' : 'flexible',
        callback: token => {
          if (!active) return;
          setFailed(false);
          onToken(token);
        },
        'expired-callback': () => { if (active) onToken(''); },
        'error-callback': fail,
      });
      cleanup = () => api.remove(widget);
    }).catch(fail);

    return () => {
      active = false;
      cleanup?.();
    };
  }, [onToken, retry]);

  if (!challengeSiteKey) return null;
  return (
    <div>
      <div ref={container} />
      {failed && (
        <div className="space-y-1 text-sm text-on-surface">
          <p role="status">A verificação de segurança não carregou.</p>
          <button type="button" className="min-h-11 font-bold text-primary underline" onClick={() => {
            setFailed(false);
            setRetry(value => value + 1);
          }}>Tentar novamente</button>
        </div>
      )}
    </div>
  );
}
