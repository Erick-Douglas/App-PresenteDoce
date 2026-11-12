begin;

create table public.catalog_categories (
  name text primary key,
  position integer generated always as identity unique,
  constraint valid_catalog_category_name check (
    char_length(name) between 1 and 60
    and name = btrim(name)
    and name !~ '[[:cntrl:]]'
    and lower(name) <> 'all'
  )
);

create unique index catalog_categories_name_case_insensitive
  on public.catalog_categories (lower(name));

insert into public.catalog_categories (name)
values ('Boxes Surpresa'), ('Caseirinhos'), ('Bolos Temáticos'), ('Brigadeiros'), ('Salgados');

alter table public.catalog_categories enable row level security;
revoke all on public.catalog_categories from public, anon, authenticated;
grant select on public.catalog_categories to anon, authenticated;
grant insert (name) on public.catalog_categories to authenticated;

create policy "catalog categories readable" on public.catalog_categories
for select to anon, authenticated using (true);

create policy "catalog admins create categories" on public.catalog_categories
for insert to authenticated with check ((select presente_doce_private.is_catalog_admin()));

alter table public.catalog_products
  add column category_name text generated always as (details ->> 'category') stored not null
    references public.catalog_categories (name),
  drop constraint valid_catalog_product,
  add constraint valid_catalog_product check (
    jsonb_typeof(details) = 'object'
    and pg_column_size(details) <= 65536
    and coalesce(jsonb_typeof(details -> 'name') = 'string' and char_length(btrim(details ->> 'name')) between 1 and 100, false)
    and coalesce(jsonb_typeof(details -> 'description') = 'string' and char_length(btrim(details ->> 'description')) between 1 and 3000, false)
    and coalesce(jsonb_typeof(details -> 'category') = 'string', false)
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
  );

commit;
