import { loadEnv } from "vite";
const env = loadEnv("production", process.cwd(), "");
const base = env.VITE_CATALOG_SUPABASE_URL || env.VITE_SUPABASE_URL,
  key = env.VITE_SUPABASE_PUBLISHABLE_KEY;
if (!base || !key)
  throw Error("Configure URL/chave publicável no ambiente local.");
const remoteFetch = (url, options = {}) =>
  fetch(url, { ...options, signal: AbortSignal.timeout(20000) });
const headers = {
  apikey: key,
  "Content-Type": "application/json",
  origin: "https://presente-doce.vercel.app",
};
const store = "11111111-1111-4111-a111-111111111111",
  proof = [];
async function check(name, path, init, expected) {
  const response = await remoteFetch(base + path, { headers, ...init });
  if (!expected.includes(response.status))
    throw Error(name + ": HTTP " + response.status);
  if (response.ok) throw Error(name + ": acesso inesperado");
  proof.push({ name, status: response.status });
  console.log("PASS " + name + ": " + response.status);
  await response.arrayBuffer();
}
const endpoint = "/functions/v1/store-api",
  body = JSON.stringify({
    store_id: store,
    action: "finance.correct",
    payload: {},
  });
await check(
  "management requires login",
  endpoint,
  { method: "POST", body },
  [401],
);
await check(
  "forged JWT rejected",
  endpoint,
  {
    method: "POST",
    headers: { ...headers, Authorization: "Bearer invalid-fixture-token" },
    body,
  },
  [401],
);
await check(
  "untrusted website rejected",
  endpoint,
  {
    method: "POST",
    headers: { ...headers, origin: "https://invalid.example.test" },
    body,
  },
  [403],
);
await check(
  "browser cannot supply a product price",
  endpoint,
  {
    method: "POST",
    body: JSON.stringify({
      store_id: store,
      action: "checkout",
      payload: {
        idempotency_key: crypto.randomUUID(),
        customer: { name: "Fixture", phone: "+351000000000" },
        delivery_date: "2026-12-20",
        fulfillment: "pickup",
        items: [
          { product_id: "bc-1", quantity: 1, mode: "preorder", price: 0.01 },
        ],
      },
    }),
  },
  [400],
);
for (const table of [
  "customers",
  "orders",
  "finance_entries",
  "pricing_recipes",
])
  await check(
    "private " + table,
    "/rest/v1/" + table + "?select=id&limit=1",
    { method: "GET" },
    [401, 403],
  );
const response = await remoteFetch(base + "/auth/v1/settings", {
  headers: { apikey: key },
});
const settings = await response.json();
console.log(
  JSON.stringify(
    {
      checks: proof,
      authSettings: {
        status: response.status,
        disable_signup: settings.disable_signup,
        anonymous_enabled:
          settings.external?.anonymous ?? settings.anonymous_users_enabled,
        email_enabled: settings.external?.email,
      },
    },
    null,
    2,
  ),
);

if(process.env.PD_SITE_URL){
 const site=process.env.PD_SITE_URL.replace(/\/$/,'');
 const started=Date.now(),response=await remoteFetch(site+'/api/store',{method:'POST',headers:{'Content-Type':'application/json',origin:site},body:'x'.repeat(66000)});
 if(response.status!==413)throw Error('Gateway body limit: '+response.status);
 console.log('PASS published gateway body limit: 413 in '+(Date.now()-started)+'ms');
}
