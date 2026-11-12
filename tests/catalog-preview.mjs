import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
const requireTest = createRequire('/tmp/pd-postgres/package.json');
const { PGlite } = requireTest('@electric-sql/pglite');
const db = new PGlite();
const guest = 'c40e4176-f518-48b5-ab35-567d5e32b67f';
const admin = 'f703a863-3cf2-4908-8d26-57887b4b00df';

try {
  await db.exec(
    "create role anon; create role authenticated; " +
    "create schema auth; create schema storage; " +
    "create table auth.users (id uuid primary key); " +
    "create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$; " +
    "grant usage on schema auth, storage to anon, authenticated; " +
    "create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]); " +
    "create table storage.objects (bucket_id text references storage.buckets, name text); " +
    "alter table storage.objects enable row level security; " +
    "grant select on storage.objects to anon, authenticated; grant insert on storage.objects to authenticated;"
  );
  for (const path of ['supabase/migrations/20261111000100_catalog.sql','supabase/migrations/20261111000200_catalog_seed.sql']) {
    await db.exec(readFileSync(path, 'utf8'));
  }
  const scalar = async (sql, params) => (await db.query(sql,params)).rows[0]?.value;
  const become = async (role, id = '') => {
    await db.exec('reset role; set role ' + role);
    await db.query("select set_config('request.jwt.claim.sub', $1, false)", [id]);
  };
  assert.equal(await scalar('select count(*)::int as value from public.catalog_products'), 13);
  assert.equal(await scalar("select allowed_mime_types[1] as value from storage.buckets where id='catalog-images'"), 'image/webp');
  await db.query('insert into auth.users values ($1), ($2)', [guest,admin]);
  await db.query('insert into presente_doce_private.catalog_admins values ($1)', [admin]);
  const data = JSON.stringify({name:'Produto de teste',description:'Apenas para verificação.',category:'Caseirinhos',price:4.25,image:'/products/bc-1.jpg'});
  const create = 'insert into public.catalog_products (id, details, published) values ($1, $2, false)';
  const upload = "insert into storage.objects values ('catalog-images', 'catalog/f703a863-3cf2-4908-8d26-57887b4b00df.webp')";
  await become('anon');
  assert.equal(await scalar('select count(*)::int as value from public.catalog_products'), 13);
  await assert.rejects(() => db.query(create, ['ficticio',data]), {code:'42501'});
  await become('authenticated', guest);
  assert.equal(await scalar('select public.is_catalog_admin() as value'), false);
  await assert.rejects(() => db.query(create, ['ficticio',data]), {code:'42501'});
  await assert.rejects(() => db.exec(upload), {code:'42501'});
  await become('authenticated', admin);
  assert.equal(await scalar('select public.is_catalog_admin() as value'), true);
  await db.query(create, ['ficticio',data]);
  await db.exec(upload);
  assert.equal(await scalar("select version as value from public.catalog_products where id='ficticio'"), 1);
  await become('anon');
  assert.equal(await scalar("select count(*)::int as value from public.catalog_products where id='ficticio'"), 0);
  await become('authenticated', admin);
  await db.exec("update public.catalog_products set published=true where id='ficticio' and version=1");
  assert.equal(await scalar("select version as value from public.catalog_products where id='ficticio'"), 2);
  const staleUpdate = await db.query("update public.catalog_products set published=false where id='ficticio' and version=1 returning id");
  assert.equal(staleUpdate.rows.length,0);
  await become('anon');
  assert.equal(await scalar("select count(*)::int as value from public.catalog_products where id='ficticio'"), 1);
  assert.equal(await scalar("select count(*)::int as value from storage.objects"), 0);
  await db.exec('reset role');
  assert.equal(await scalar("select count(*)::int as value from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname='is_catalog_admin' and p.prosecdef"), 0);
  console.log('PD_SQL_OK: 13 seeded products, draft visibility, authorized publication, optimistic versioning and storage permissions.');
} finally {
  await db.close();
}
