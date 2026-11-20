do $migration$
declare definition text;
begin
 select pg_get_constraintdef(oid) into strict definition from pg_constraint
 where conrelid='public.catalog_products'::regclass and conname='valid_catalog_product';
 definition := replace(definition, chr(92)||chr(92)||'.', '[.]');
 definition := replace(definition, chr(92)||'.', '[.]');
 definition := replace(definition, '{36}[.]webp$', '{36}[.](webp|jpg)$');
 if position('{36}[.](webp|jpg)$' in definition) = 0 then
   raise exception 'Catalog image constraint pattern not recognized';
 end if;
 alter table public.catalog_products drop constraint valid_catalog_product;
 execute 'alter table public.catalog_products add constraint valid_catalog_product '||definition;
end
$migration$;
