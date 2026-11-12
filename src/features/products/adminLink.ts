export type RecoveryCallback = { token: string } | { invalid: true };

export function readRecoveryCallback(url: URL): RecoveryCallback | null {
  if (url.pathname !== '/' && url.pathname.replace(/\/$/, '') !== '/admin') return null;
  const params = new URLSearchParams(url.hash.slice(1));
  const token = params.get('access_token');
  if (params.get('type') === 'recovery') {
    return token && token.length <= 8192 && /^[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+){2}$/.test(token)
      ? { token }
      : { invalid: true };
  }
  if (url.searchParams.get('recuperar') === '1' && (params.has('error') || params.has('error_code') || token)) {
    return { invalid: true };
  }
  return null;
}

export function readManualRecoveryToken(value: string, projectUrl: string) {
  let link: URL;
  try {
    link = new URL(value.trim());
  } catch {
    throw new Error('Cole o endereço completo do e-mail de recuperação.');
  }
  const token = link.searchParams.get('token_hash') ?? link.searchParams.get('token');
  if (link.origin !== projectUrl || link.username || link.password || link.pathname !== '/auth/v1/verify' ||
    link.searchParams.get('type') !== 'recovery' || !token || !/^[A-Za-z0-9_-]{16,256}$/.test(token)) {
    throw new Error('Use o link de recuperação mais recente da Presente Doce.');
  }
  return token;
}
