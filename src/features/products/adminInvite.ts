export function readInviteToken(value: string, projectUrl: string) {
  let link: URL;
  try {
    link = new URL(value.trim());
  } catch {
    throw new Error('Cole o endereço completo do convite enviado pelo Supabase.');
  }
  const token = link.searchParams.get('token_hash') ?? link.searchParams.get('token');
  if (link.origin !== projectUrl || link.username || link.password || link.pathname !== '/auth/v1/verify' ||
    link.searchParams.get('type') !== 'invite' || !token || !/^[A-Za-z0-9_-]{16,256}$/.test(token)) {
    throw new Error('Use o link de convite do projeto Supabase da Presente Doce.');
  }
  return token;
}
