begin;

create schema presente_doce_private;
revoke all on schema presente_doce_private from public, anon, authenticated;
grant usage on schema presente_doce_private to authenticated;

create table presente_doce_private.catalog_admins (
  user_id uuid primary key references auth.users (id) on delete cascade
);
alter table presente_doce_private.catalog_admins enable row level security;

create function presente_doce_private.is_catalog_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from presente_doce_private.catalog_admins where user_id = (select auth.uid())
  );
$$;
revoke all on function presente_doce_private.is_catalog_admin() from public, anon, authenticated;
grant execute on function presente_doce_private.is_catalog_admin() to authenticated;

create function public.is_catalog_admin()
returns boolean
language sql
stable
security invoker
set search_path = ''
as $$
  select presente_doce_private.is_catalog_admin();
$$;
revoke all on function public.is_catalog_admin() from public, anon, authenticated;
grant execute on function public.is_catalog_admin() to authenticated;

create table public.catalog_products (
  id text primary key check (id ~ '^[a-z0-9-]{1,64}$'),
  details jsonb not null,
  published boolean not null default false,
  version integer not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint valid_catalog_product check (
    jsonb_typeof(details) = 'object'
    and pg_column_size(details) <= 65536
    and coalesce(jsonb_typeof(details -> 'name') = 'string' and char_length(btrim(details ->> 'name')) between 1 and 100, false)
    and coalesce(jsonb_typeof(details -> 'description') = 'string' and char_length(btrim(details ->> 'description')) between 1 and 3000, false)
    and coalesce(details ->> 'category' in ('Boxes Surpresa', 'Caseirinhos', 'Bolos Temáticos', 'Brigadeiros', 'Salgados'), false)
    and case when jsonb_typeof(details -> 'price') = 'number'
      then (details ->> 'price')::numeric between 0 and 99999.99 and scale((details ->> 'price')::numeric) <= 2
      else false end
    and coalesce(
      details ->> 'image' = ''
      or details ->> 'image' ~ '^/products/[a-zA-Z0-9._-]+\.(jpg|jpeg|png|webp)$'
      or details ->> 'image' ~ '^https://lh3\.googleusercontent\.com/[a-zA-Z0-9/_-]+$'
      or details ->> 'image' ~ '^catalog/[a-f0-9-]{36}\.webp$',
      false
    )
    and (not published or ((details ->> 'price')::numeric > 0 and details ->> 'image' <> ''))
    and (not (details ? 'variants') or jsonb_typeof(details -> 'variants') = 'array')
    and (not (details ? 'flavors') or jsonb_typeof(details -> 'flavors') = 'array')
    and (not (details ? 'tags') or jsonb_typeof(details -> 'tags') = 'array')
  )
);

create function presente_doce_private.set_catalog_version()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.version := old.version + 1;
  new.updated_at := now();
  return new;
end;
$$;

create trigger set_catalog_version
before update on public.catalog_products
for each row execute function presente_doce_private.set_catalog_version();

alter table public.catalog_products enable row level security;
revoke all on public.catalog_products from public, anon, authenticated;
grant select on public.catalog_products to anon, authenticated;
grant insert (id, details, published), update (details, published) on public.catalog_products to authenticated;

create policy "published catalog readable" on public.catalog_products
for select to anon, authenticated using (published);

create policy "catalog admins read all products" on public.catalog_products
for select to authenticated using ((select presente_doce_private.is_catalog_admin()));

create policy "catalog admins create products" on public.catalog_products
for insert to authenticated with check ((select presente_doce_private.is_catalog_admin()));

create policy "catalog admins update products" on public.catalog_products
for update to authenticated using ((select presente_doce_private.is_catalog_admin()))
with check ((select presente_doce_private.is_catalog_admin()));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('catalog-images', 'catalog-images', true, 5242880, array['image/webp']);

create policy "catalog admins upload images" on storage.objects
for insert to authenticated with check (
  bucket_id = 'catalog-images'
  and name ~ '^catalog/[a-f0-9-]{36}\.webp$'
  and (select presente_doce_private.is_catalog_admin())
);

commit;
