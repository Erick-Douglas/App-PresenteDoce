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
  catalog.search = 'select=id,details,published,version&published=eq.true&order=display_order.asc.nullslast,created_at.asc,id.asc&limit=1';
  const categories = new URL('/rest/v1/catalog_categories', host);
  categories.search = 'select=id,name,cover,order_mode&order=display_order.asc.nullslast,position.asc';
  const options = { headers: { apikey: key }, signal: AbortSignal.timeout(10000) };
  const presentation = new URL('/rest/v1/store_presentation?id=is.true&select=home_title,revision', host);
  const [productsResponse, categoriesResponse, presentationResponse] = await Promise.all([
    fetch(catalog, options), fetch(categories, options), fetch(presentation, options),
  ]);
  if (!productsResponse.ok) throw new Error('The public catalog API returned HTTP ' + productsResponse.status + '.');
  if (!categoriesResponse.ok) throw new Error('The public categories API returned HTTP ' + categoriesResponse.status + '.');
  if (!presentationResponse.ok) throw new Error('The public presentation API returned HTTP ' + presentationResponse.status + '.');
  const settings = await presentationResponse.json();
  if (!Array.isArray(settings) || settings.length !== 1 || typeof settings[0].home_title !== 'string' ||
      !Number.isInteger(settings[0].revision)) throw new Error('The public presentation API returned an unexpected response.');
  const [rows, categoryRows] = await Promise.all([productsResponse.json(), categoriesResponse.json()]);
  if (!Array.isArray(rows) || !rows.every(row => row.published === true && typeof row.details?.name === 'string' && Number.isInteger(row.version))) {
    throw new Error('The public catalog API returned an unexpected response.');
  }
  if (!Array.isArray(categoryRows) || !categoryRows.every(row => typeof row.id === 'string' && typeof row.name === 'string' &&
      ['simple', 'cake', 'brigadeiros', 'salgados'].includes(row.order_mode)) ||
      !rows.every(row => categoryRows.some(category => category.name === row.details.category))) {
    throw new Error('The public categories API returned an unexpected response.');
  }
  console.log('Managed products, categories and presentation verified with the publishable key.');
}
