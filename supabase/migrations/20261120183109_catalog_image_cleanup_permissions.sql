begin;
create policy "catalog admins read image metadata" on storage.objects for select to authenticated using (bucket_id='catalog-images' and (select presente_doce_private.is_catalog_admin()));
create policy "catalog admins remove images" on storage.objects for delete to authenticated using (bucket_id='catalog-images' and (select presente_doce_private.is_catalog_admin()));
commit;