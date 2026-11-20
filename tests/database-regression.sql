begin;
insert into auth.users(id,aud,role,email) values ('00000000-0000-4000-a000-000000000020','authenticated','authenticated','qa-review@example.test');
insert into presente_doce_private.catalog_admins(user_id) values ('00000000-0000-4000-a000-000000000020');
insert into public.catalog_categories(id,name,topics) values ('00000000-0000-4000-a000-000000000021','QA revisão transacional','[{"id":"00000000-0000-4000-a000-000000000022","name":"Sem açúcar"}]');
set local request.jwt.claims = '{"sub":"00000000-0000-4000-a000-000000000020","role":"authenticated"}';
set local role authenticated;
do $test$
declare item jsonb; n integer;
begin
 if not public.is_catalog_admin() then raise exception 'Admin fixture rejected'; end if;
 insert into public.catalog_products(id,details,published) values ('qa-review-20261120',
 '{"name":"QA revisão","description":"Fixture transacional","price":10,"image":"","category":"QA revisão transacional","topicIds":["00000000-0000-4000-a000-000000000022"]}',false);
 select details into item from public.catalog_products where id='qa-review-20261120';
 if item->'tags' <> '["Sem açúcar"]'::jsonb then raise exception 'Topic association failed'; end if;
 insert into public.pricing_recipes(id,product_id,recipe) values ('00000000-0000-4000-a000-000000000023','qa-review-20261120',
 '{"title":"Ficha QA","yieldCount":"4","salePrice":"12","ingredients":[{"name":"Farinha","unit":"g","packQuantity":"1000","packPrice":"4","usedQuantity":"250"}]}');
 begin
   update public.pricing_recipes set recipe=jsonb_set(recipe,'{yieldCount}','""') where id='00000000-0000-4000-a000-000000000023';
   raise exception 'Incomplete recipe accepted';
 exception when check_violation then null; end;
 select recipe into item from public.pricing_recipes where id='00000000-0000-4000-a000-000000000023';
 if item->>'yieldCount'<>'4' then raise exception 'Original recipe overwritten'; end if;
 update public.pricing_recipes set recipe=jsonb_set(recipe,'{salePrice}','"13"') where id='00000000-0000-4000-a000-000000000023' and version=1;
 update public.pricing_recipes set recipe=jsonb_set(recipe,'{salePrice}','"14"') where id='00000000-0000-4000-a000-000000000023' and version=1;
 get diagnostics n=row_count;
 if n<>0 then raise exception 'Stale version overwrote recipe'; end if;
 perform public.save_catalog_category('00000000-0000-4000-a000-000000000021',1,'QA revisão transacional',
 '[{"id":"00000000-0000-4000-a000-000000000022","name":"Sem açúcar refinado"}]');
 select details into item from public.catalog_products where id='qa-review-20261120';
 if item->'tags' <> '["Sem açúcar refinado"]'::jsonb then raise exception 'Renamed topic not synchronized'; end if;
 perform public.save_catalog_category('00000000-0000-4000-a000-000000000021',2,'QA revisão transacional','[]');
 select details into item from public.catalog_products where id='qa-review-20261120';
 if item->'topicIds' <> '[]'::jsonb then raise exception 'Deleted topic not removed'; end if;
end $test$;
reset role;
set local role anon;
do $test$ declare n integer; begin
 perform topics from public.catalog_categories limit 1;
 select count(*) into n from public.catalog_products where id='qa-review-20261120';
 if n<>0 then raise exception 'Draft exposed to anon'; end if;
 begin
   perform recipe from public.pricing_recipes;
   raise exception 'Pricing exposed to anon';
 exception when insufficient_privilege then null; end;
end $test$;
reset role;
rollback;
