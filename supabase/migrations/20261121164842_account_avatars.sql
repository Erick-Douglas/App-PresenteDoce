begin;
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types) values('account-avatars','account-avatars',true,2097152,array['image/jpeg','image/png','image/webp']);
create policy "owners upload account avatars" on storage.objects for insert to authenticated with check (bucket_id='account-avatars' and name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}[.](webp|jpg)$' and split_part(name,'/',1)=(select auth.uid())::text and coalesce((select auth.jwt())->>'is_anonymous','false')<>'true');
create policy "owners read account avatar metadata" on storage.objects for select to authenticated using (bucket_id='account-avatars' and split_part(name,'/',1)=(select auth.uid())::text);
create policy "owners remove account avatars" on storage.objects for delete to authenticated using (bucket_id='account-avatars' and split_part(name,'/',1)=(select auth.uid())::text);
commit;
