begin;
update storage.buckets set file_size_limit=2097152,allowed_mime_types=array['image/webp','image/jpeg'] where id='catalog-images';
commit;
