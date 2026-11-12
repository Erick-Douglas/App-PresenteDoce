const env = process.env;

if (env.VITE_CATALOG_SOURCE !== 'supabase') {
  if (env.VERCEL_ENV === 'production') throw new Error('Production must use the managed catalog.');
  console.log('Catalog check skipped for the static development catalog.');
} else {
  const host = (env.VITE_CATALOG_SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').trim();
  const key = (env.VITE_SUPABASE_PUBLISHABLE_KEY ?? '').trim();
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/.test(host) || !key.startsWith('sb_publishable_')) {
    throw new Error('Configure the catalog URL and publishable key for this environment.');
  }

  const catalog = new URL('/rest/v1/catalog_products', host);
  catalog.search = 'select=id,details,published,version&published=eq.true&limit=1';
  const response = await fetch(catalog, { headers: { apikey: key }, signal: AbortSignal.timeout(10000) });
  if (!response.ok) throw new Error('The public catalog API returned HTTP ' + response.status + '.');
  const rows = await response.json();
  if (!Array.isArray(rows) || !rows.every(row => row.published === true && typeof row.details?.name === 'string' && Number.isInteger(row.version))) {
    throw new Error('The public catalog API returned an unexpected response.');
  }
  console.log('Managed catalog verified with the publishable key.');
}
