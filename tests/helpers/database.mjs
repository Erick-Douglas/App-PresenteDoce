import { PGlite } from "@electric-sql/pglite";
import fs from "node:fs";
export async function createDatabase(staged = [], beforeMigration) {
  const db = new PGlite();
  await db.exec(`
 create role anon;create role authenticated;create role service_role bypassrls;
 create schema auth;create table auth.users(id uuid primary key,email text,email_confirmed_at timestamptz default now());
 create function auth.uid() returns uuid language sql stable as $$select coalesce(nullif(current_setting('request.jwt.claim.sub',true),''),nullif(current_setting('request.jwt.claims',true),'')::jsonb->>'sub')::uuid$$;
 grant usage on schema auth to anon,authenticated;grant execute on function auth.uid() to anon,authenticated;
 create schema storage;create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
 create table storage.objects(id uuid default gen_random_uuid(),bucket_id text,name text,owner_id text,metadata jsonb);
 alter table storage.objects enable row level security;grant usage on schema storage to authenticated;grant insert,select,delete on storage.objects to authenticated;
 insert into auth.users values('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa','a@example.test');
 `);
  for (const p of fs
    .readdirSync("supabase/migrations")
    .sort()
    .filter((p) => p.endsWith(".sql"))) {
    if (beforeMigration) await beforeMigration(db, p);
    try {
      await db.exec(fs.readFileSync("supabase/migrations/" + p, "utf8"));
    } catch (e) {
      await db.close();
      throw Error(p + ": " + e.message);
    }
    if (p === "20261112002801_presente_doce_catalog.sql")
      await db.exec(
        "insert into presente_doce_private.catalog_admins values('aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa')",
      );
  }
  for (const p of staged)
    try {
      await db.exec(fs.readFileSync(p, "utf8"));
    } catch (e) {
      throw Error(p + ": " + e.message);
    }
  return db;
}
export async function scope(
  db,
  user = "aaaaaaaa-aaaa-4aaa-aaaa-aaaaaaaaaaaa",
  store = "11111111-1111-4111-a111-111111111111",
  role = "authenticated",
) {
  await db.exec(
    "reset role;set request.jwt.claim.sub='" +
      user +
      "';set request.headers='" +
      JSON.stringify({ "x-store-id": store }) +
      "';set role " +
      role,
  );
}
