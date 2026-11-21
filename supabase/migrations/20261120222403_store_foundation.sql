begin;
create function presente_doce_private.current_store_id() returns uuid language sql stable set search_path='' as $$
 select coalesce(nullif(current_setting('request.headers',true),'')::jsonb->>'x-store-id','11111111-1111-4111-a111-111111111111')::uuid;
$$;
revoke all on function presente_doce_private.current_store_id() from public;
grant usage on schema presente_doce_private to anon;
grant execute on function presente_doce_private.current_store_id() to anon,authenticated,service_role;
create table public.stores(
 id uuid primary key default gen_random_uuid(), slug text not null unique check(slug ~ '^[a-z0-9][a-z0-9-]{2,49}$'),
 name text not null check(length(btrim(name)) between 1 and 100), logo_url text not null default '/logo.png',
 primary_color text not null default '#800000' check(primary_color ~ '^#[0-9A-Fa-f]{6}$'),
 currency text not null default 'EUR' check(currency in('EUR','BRL','USD','GBP')),
 timezone text not null default 'Europe/Lisbon', visible boolean not null default true, created_at timestamptz not null default now());
create table public.store_members(
 store_id uuid not null references public.stores(id), user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check(role in('owner','manager','staff')), active boolean not null default true, primary key(store_id,user_id));
create table public.store_entitlements(
 store_id uuid primary key references public.stores(id), status text not null check(status in('internal','trial','active','past_due','canceled')),
 expires_at timestamptz, provider_customer_id text unique, provider_subscription_id text unique, updated_at timestamptz not null default now());
create function presente_doce_private.is_store_member(p_store uuid,p_write boolean default false) returns boolean
 language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.store_members m where m.store_id=p_store and m.user_id=(select auth.uid()) and m.active
  and (not p_write or m.role in('owner','manager'))) and (not p_write or exists(
  select 1 from public.store_entitlements e where e.store_id=p_store and (e.status='internal' or
   (e.status in('active','trial') and (e.expires_at is null or e.expires_at>now())))));
$$;
revoke all on function presente_doce_private.is_store_member(uuid,boolean) from public;
grant execute on function presente_doce_private.is_store_member(uuid,boolean) to anon,authenticated,service_role;
insert into public.stores(id,slug,name) values ('11111111-1111-4111-a111-111111111111','presente-doce','Presente Doce');
insert into public.store_members(store_id,user_id,role) select '11111111-1111-4111-a111-111111111111',user_id,'owner' from presente_doce_private.catalog_admins;
insert into public.store_entitlements(store_id,status) values('11111111-1111-4111-a111-111111111111','internal');

create or replace function presente_doce_private.is_catalog_admin() returns boolean language sql stable security definer set search_path='' as $$
 select presente_doce_private.is_store_member(presente_doce_private.current_store_id(),false);
$$;
alter table public.catalog_products add column store_id uuid not null default '11111111-1111-4111-a111-111111111111' references public.stores(id);
alter table public.catalog_categories add column store_id uuid not null default '11111111-1111-4111-a111-111111111111' references public.stores(id);
alter table public.pricing_recipes add column store_id uuid not null default '11111111-1111-4111-a111-111111111111' references public.stores(id);
alter table public.store_presentation add column store_id uuid not null default '11111111-1111-4111-a111-111111111111' references public.stores(id);
alter table public.catalog_products alter column store_id set default presente_doce_private.current_store_id();
alter table public.catalog_categories alter column store_id set default presente_doce_private.current_store_id();
alter table public.pricing_recipes alter column store_id set default presente_doce_private.current_store_id();
alter table public.store_presentation alter column store_id set default presente_doce_private.current_store_id();
alter table public.catalog_products drop constraint catalog_products_category_name_fkey;
alter table public.catalog_categories drop constraint catalog_categories_pkey;
alter table public.catalog_categories add primary key(store_id,name);
drop index public.catalog_categories_name_case_insensitive;
create unique index catalog_categories_name_case_insensitive on public.catalog_categories(store_id,lower(name));
alter table public.catalog_products add constraint catalog_products_category_name_fkey foreign key(store_id,category_name) references public.catalog_categories(store_id,name) deferrable initially immediate;
alter table public.catalog_products add unique(store_id,id);
alter table public.catalog_categories add unique(store_id,id);
alter table public.pricing_recipes drop constraint pricing_recipes_product_id_fkey;
alter table public.pricing_recipes add foreign key(store_id,product_id) references public.catalog_products(store_id,id) on delete set null(product_id);
alter table public.store_presentation drop constraint store_presentation_pkey;
alter table public.store_presentation add primary key(store_id,id);

create function presente_doce_private.keep_store() returns trigger language plpgsql set search_path='' as $$
begin if new.store_id is distinct from old.store_id then raise exception 'Store cannot be changed' using errcode='42501'; end if;return new;end $$;
revoke all on function presente_doce_private.keep_store() from public;
do $policies$
declare tab text; pol record; fn record;
begin
 foreach tab in array array['catalog_products','catalog_categories','pricing_recipes','store_presentation'] loop
  for pol in select policyname from pg_policies where schemaname='public' and tablename=tab loop
   execute format('drop policy %I on public.%I',pol.policyname,tab);
  end loop;
  execute format('create policy member_read on public.%I for select to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id))',tab);
  execute format('create policy member_write on public.%I for all to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true)) with check(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true))',tab);
  execute format('create trigger keep_store before update on public.%I for each row execute function presente_doce_private.keep_store()',tab);
 end loop;
 -- Legacy category functions now run under the caller and the scoped policies.
 for fn in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace
  where n.nspname='presente_doce_private' and p.proname in('catalog_category_details','save_catalog_category','delete_catalog_category') loop
  execute format('alter function %s security invoker',fn.signature);
 end loop;
end $policies$;
create policy public_catalog on public.catalog_products for select to anon,authenticated using(store_id=presente_doce_private.current_store_id() and published and exists(select 1 from public.stores s where s.id=store_id and s.visible));
create policy public_categories on public.catalog_categories for select to anon,authenticated using(store_id=presente_doce_private.current_store_id() and exists(select 1 from public.stores s where s.id=store_id and s.visible));
create policy public_presentation on public.store_presentation for select to anon,authenticated using(store_id=presente_doce_private.current_store_id() and exists(select 1 from public.stores s where s.id=store_id and s.visible));
grant select on public.catalog_categories to authenticated;
grant update(name,topics,revision,display_order,cover,order_mode),delete on public.catalog_categories to authenticated;
grant update(display_order) on public.catalog_products to authenticated;
grant execute on function presente_doce_private.require_catalog_admin() to authenticated;

create or replace function presente_doce_private.sync_product_topics() returns trigger language plpgsql security definer set search_path='' as $$
declare picked_ids jsonb;picked_names jsonb;
begin
 if tg_op='UPDATE' and (old.details->>'category') is distinct from (new.details->>'category')
 and exists(select 1 from public.catalog_categories where name=old.details->>'category' and store_id=old.store_id) then new.display_order:=null;end if;
 if not(new.details ? 'topicIds') then return new;end if;
 if jsonb_typeof(new.details->'topicIds')<>'array' then raise exception 'Invalid product topics' using errcode='22023';end if;
 select coalesce(jsonb_agg(t.value->'id' order by t.ordinality),'[]'),coalesce(jsonb_agg(t.value->'name' order by t.ordinality),'[]')
 into picked_ids,picked_names from public.catalog_categories c cross join lateral jsonb_array_elements(c.topics) with ordinality t
 where c.store_id=new.store_id and c.name=new.details->>'category' and (new.details->'topicIds') ? (t.value->>'id');
 new.details:=new.details||jsonb_build_object('topicIds',picked_ids,'tags',picked_names);return new;
end $$;
alter table public.stores enable row level security;
alter table public.store_members enable row level security;
alter table public.store_entitlements enable row level security;
revoke all on public.stores,public.store_members,public.store_entitlements from public,anon,authenticated;
grant select on public.stores to anon,authenticated;
grant select on public.store_members,public.store_entitlements to authenticated;
create policy store_public on public.stores for select to anon,authenticated using(visible or presente_doce_private.is_store_member(id));
create policy own_membership on public.store_members for select to authenticated using(user_id=(select auth.uid()) and active);
create policy own_entitlement on public.store_entitlements for select to authenticated using(presente_doce_private.is_store_member(store_id));

-- Preserve legacy pilot uploads while old clients are in use.
alter policy "catalog admins upload images" on storage.objects with check(bucket_id='catalog-images'
 and ((name ~ '^[a-f0-9-]{36}/[a-f0-9-]{36}[.](webp|jpg)$' and split_part(name,'/',1)=presente_doce_private.current_store_id()::text)
 or (presente_doce_private.current_store_id()='11111111-1111-4111-a111-111111111111' and name ~ '^catalog/[a-f0-9-]{36}[.](webp|jpg)$'))
 and presente_doce_private.is_store_member(presente_doce_private.current_store_id(),true));
alter policy "catalog admins read image metadata" on storage.objects using(bucket_id='catalog-images'
 and presente_doce_private.is_store_member(presente_doce_private.current_store_id())
 and (split_part(name,'/',1)=presente_doce_private.current_store_id()::text
 or (name like 'catalog/%' and presente_doce_private.current_store_id()='11111111-1111-4111-a111-111111111111')));
alter policy "catalog admins remove images" on storage.objects using(bucket_id='catalog-images'
 and presente_doce_private.is_store_member(presente_doce_private.current_store_id(),true)
 and (split_part(name,'/',1)=presente_doce_private.current_store_id()::text
 or (name like 'catalog/%' and presente_doce_private.current_store_id()='11111111-1111-4111-a111-111111111111')));
do $images$ declare definition text;begin
 select pg_get_constraintdef(oid) into strict definition from pg_constraint where conrelid='public.catalog_products'::regclass and conname='valid_catalog_product';
 definition:=replace(definition,'^catalog/[a-f0-9-]{36}[.](webp|jpg)$','^(catalog|[a-f0-9-]{36})/[a-f0-9-]{36}[.](webp|jpg)$');
 if position('^(catalog|' in definition)=0 then raise exception 'Image constraint not recognized';end if;
 alter table public.catalog_products drop constraint valid_catalog_product;
 execute 'alter table public.catalog_products add constraint valid_catalog_product '||definition;
end $images$;
commit;
