begin;
update storage.buckets set allowed_mime_types=array['image/webp','image/jpeg'] where id='catalog-images';
alter policy "catalog admins upload images" on storage.objects with check (bucket_id = 'catalog-images' and name ~ '^catalog/[a-f0-9-]{36}[.](webp|jpg)$' and (select presente_doce_private.is_catalog_admin()));
do $repair$
declare definition text;
begin
 select pg_get_constraintdef(oid) into definition from pg_constraint where conrelid='public.catalog_products'::regclass and conname='valid_catalog_product';
 definition := replace(definition, '{36}[.]webp$', '{36}[.](webp|jpg)$');
 if definition is null then raise exception 'Missing product constraint'; end if;
 alter table public.catalog_products drop constraint valid_catalog_product;
 execute 'alter table public.catalog_products add constraint valid_catalog_product ' || definition;
end $repair$;
create table public.pricing_recipes (
 id uuid primary key default gen_random_uuid(),
 product_id text references public.catalog_products(id) on delete set null,
 recipe jsonb not null,
 version integer not null default 1,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 constraint valid_pricing_recipe check (
 jsonb_typeof(recipe)='object' and pg_column_size(recipe)<=65536
 and jsonb_typeof(recipe->'ingredients')='array'
 and jsonb_array_length(recipe->'ingredients') between 1 and 70
 and coalesce(jsonb_typeof(recipe->'title')='string',false)
 and coalesce(jsonb_typeof(recipe->'yieldCount')='string',false)
 and coalesce(jsonb_typeof(recipe->'salePrice')='string',false))
);
alter table public.pricing_recipes enable row level security;
revoke all on public.pricing_recipes from public,anon,authenticated;
grant select,delete on public.pricing_recipes to authenticated;
grant insert(id,product_id,recipe),update(product_id,recipe) on public.pricing_recipes to authenticated;
create policy "catalog admins manage pricing" on public.pricing_recipes for all to authenticated
 using ((select presente_doce_private.is_catalog_admin()))
 with check ((select presente_doce_private.is_catalog_admin()));
create trigger set_pricing_version before update on public.pricing_recipes for each row execute function presente_doce_private.set_catalog_version();
commit;