begin;

grant delete on public.catalog_products to authenticated;

create policy "catalog admins delete products" on public.catalog_products
for delete to authenticated
using ((select presente_doce_private.is_catalog_admin()));

commit;
