begin;
alter policy "catalog admins upload images" on storage.objects with check (bucket_id = 'catalog-images' and name ~ '^catalog/[a-f0-9-]{36}[.]webp$' and (select presente_doce_private.is_catalog_admin()));
do $repair$
declare definition text;
begin
 select pg_get_constraintdef(oid) into definition from pg_constraint where conrelid='public.catalog_products'::regclass and conname='valid_catalog_product';
 if definition is null then raise exception 'Expected product constraint missing'; end if;
 definition := replace(definition, chr(92)||chr(92)||'.', '[.]');
 alter table public.catalog_products drop constraint valid_catalog_product;
 execute 'alter table public.catalog_products add constraint valid_catalog_product ' || definition;
end $repair$;
commit;
