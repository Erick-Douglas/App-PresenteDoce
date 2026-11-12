export type AdminLinkType = 'invite' | 'recovery';

export function readAdminLinkToken(value: string, projectUrl: string, type: AdminLinkType) {
  const message = type === 'invite' ? 'convite' : 'recuperação';
  let link: URL;
  try {
    link = new URL(value.trim());
  } catch {
    throw new Error('Cole o endereço completo do e-mail de ' + message + ' do Supabase.');
  }
  const token = link.searchParams.get('token_hash') ?? link.searchParams.get('token');
  if (link.origin !== projectUrl || link.username || link.password || link.pathname !== '/auth/v1/verify' ||
    link.searchParams.get('type') !== type || !token || !/^[A-Za-z0-9_-]{16,256}$/.test(token)) {
    throw new Error('Use o link de ' + message + ' mais recente, enviado pelo Supabase da Presente Doce.');
  }
  return token;
}
