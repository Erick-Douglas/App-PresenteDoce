import assert from 'node:assert/strict';

const host = process.env.VITE_SUPABASE_URL;
const key = process.env.VITE_SUPABASE_PUBLISHABLE_KEY;
assert.equal(process.env.VITE_CATALOG_SOURCE, 'supabase');
assert.match(host ?? '', /^https:\/\/[a-z0-9]+\.supabase\.co$/);
assert.ok(key?.startsWith('sb_publishable_'));
const response = await fetch(host + '/rest/v1/catalog_products?select=id,details,published,version&published=eq.true&order=created_at.asc,id.asc', { headers: { apikey: key }, signal: AbortSignal.timeout(15000) });
assert.equal(response.status, 200);
const products = await response.json();
assert.equal(products.length, 13);
assert.ok(products.every(product => product.published && typeof product.details?.name === 'string' && product.version === 1));
const auth = await fetch(host + '/auth/v1/token?grant_type=password', {
  method: 'POST',
  headers: { apikey: key, 'Content-Type': 'application/json' },
  body: JSON.stringify({email:'catalogue-check@example.invalid',password:'placeholder-for-invalid-account-test'}),
  signal: AbortSignal.timeout(15000),
});
assert.ok([400,401,422].includes(auth.status), 'Auth must reject an unregistered test account');
console.log('PD_LIVE_OK: 13 public products via Supabase REST, invalid sign-in rejected.');
