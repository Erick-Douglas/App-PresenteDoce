begin;

set local lock_timeout = '5s';

alter table public.catalog_categories
  add column id uuid not null default gen_random_uuid() unique,
  add column revision integer not null default 1,
  add column display_order integer,
  add column cover text,
  add column order_mode text not null default 'simple' check (order_mode in ('simple', 'cake', 'brigadeiros', 'salgados')),
  add column topics jsonb not null default '[]'::jsonb check (jsonb_typeof(topics) = 'array');

alter table public.catalog_products
  add column display_order integer,
  alter constraint catalog_products_category_name_fkey deferrable initially immediate;

update public.catalog_categories
set cover = case name
      when 'Boxes Surpresa' then '/products/kt-1.jpg'
      when 'Caseirinhos' then '/products/bc-7.jpg'
      when 'Bolos Temáticos' then '/products/bt-1.jpg'
      when 'Brigadeiros' then '/products/br-1.jpg'
      when 'Salgados' then '/products/sl-1.jpg'
    end,
    order_mode = case name
      when 'Bolos Temáticos' then 'cake'
      when 'Brigadeiros' then 'brigadeiros'
      when 'Salgados' then 'salgados'
      else 'simple'
    end;

with names as (
  select p.category_name, lower(btrim(tag.value)) as key, min(btrim(tag.value)) as name
  from public.catalog_products p
  cross join lateral jsonb_array_elements_text(coalesce(p.details -> 'tags', '[]'::jsonb)) tag
  where btrim(tag.value) <> ''
  group by p.category_name, lower(btrim(tag.value))
), registry as (
  select category_name, jsonb_agg(jsonb_build_object('id', gen_random_uuid(), 'name', name) order by key) as topics
  from names
  group by category_name
)
update public.catalog_categories c set topics = registry.topics
from registry where c.name = registry.category_name;

update public.catalog_products p
set details = p.details || jsonb_build_object(
  'orderMode', case when p.details -> 'configuravel' = 'true'::jsonb then c.order_mode else 'simple' end,
  'topicIds', coalesce((
    select jsonb_agg(topic.value -> 'id' order by topic.ordinality)
    from jsonb_array_elements(c.topics) with ordinality topic
    where exists (
      select 1 from jsonb_array_elements_text(coalesce(p.details -> 'tags', '[]'::jsonb)) tag
      where lower(btrim(tag.value)) = lower(topic.value ->> 'name')
    )
  ), '[]'::jsonb)
)
from public.catalog_categories c where c.name = p.category_name;

revoke select on public.catalog_categories from public, anon, authenticated;
grant select (id, name, position, display_order, cover, order_mode) on public.catalog_categories to anon, authenticated;

create function presente_doce_private.sync_product_topics()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  picked_ids jsonb;
  picked_names jsonb;
begin
  if tg_op = 'UPDATE' and (old.details ->> 'category') is distinct from (new.details ->> 'category')
      and exists (select 1 from public.catalog_categories where name = (old.details ->> 'category')) then
    new.display_order := null;
  end if;
  if not (new.details ? 'topicIds') then return new; end if;
  if jsonb_typeof(new.details -> 'topicIds') <> 'array' then
    raise exception 'Invalid product topics' using errcode = '22023';
  end if;
  select coalesce(jsonb_agg(t.value -> 'id' order by t.ordinality), '[]'::jsonb),
         coalesce(jsonb_agg(t.value -> 'name' order by t.ordinality), '[]'::jsonb)
  into picked_ids, picked_names
  from public.catalog_categories c
  cross join lateral jsonb_array_elements(c.topics) with ordinality t
  where c.name = (new.details ->> 'category')
    and (new.details -> 'topicIds') ? (t.value ->> 'id');
  new.details := new.details || jsonb_build_object('topicIds', picked_ids, 'tags', picked_names);
  return new;
end;
$$;

revoke all on function presente_doce_private.sync_product_topics() from public, anon, authenticated;
create trigger sync_product_topics before insert or update of details on public.catalog_products
for each row execute function presente_doce_private.sync_product_topics();

create function presente_doce_private.require_catalog_admin()
returns void language plpgsql stable set search_path = ''
as $$
begin
  if not presente_doce_private.is_catalog_admin() then
    raise exception 'Catalog administrator required' using errcode = '42501';
  end if;
end;
$$;
revoke all on function presente_doce_private.require_catalog_admin() from public, anon, authenticated;

create function presente_doce_private.catalog_category_details()
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  perform presente_doce_private.require_catalog_admin();
  return coalesce((
    select jsonb_agg(to_jsonb(c) order by c.display_order nulls last, c.position)
    from public.catalog_categories c
  ), '[]'::jsonb);
end;
$$;

create function presente_doce_private.save_catalog_category(
  p_id uuid, p_revision integer, p_name text, p_topics jsonb,
  p_product_ids text[], p_expected_product_ids text[], p_category_ids uuid[], p_expected_category_ids uuid[]
)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  current_category public.catalog_categories%rowtype;
  product_ids text[];
  category_ids uuid[];
begin
  perform presente_doce_private.require_catalog_admin();
  lock table public.catalog_categories, public.catalog_products in share row exclusive mode;
  select * into current_category from public.catalog_categories where id = p_id;
  if not found or current_category.revision is distinct from p_revision then
    raise sqlstate 'PT409' using message = 'Category changed';
  end if;

  if p_topics is null or jsonb_typeof(p_topics) <> 'array' then
    raise exception 'Invalid category topics' using errcode = '22023';
  end if;
  if jsonb_array_length(p_topics) > 100 or exists (
    select 1 from jsonb_array_elements(p_topics) topic
    where not coalesce(
      jsonb_typeof(topic) = 'object' and jsonb_typeof(topic -> 'name') = 'string'
      and topic ->> 'id' ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
      and char_length(topic ->> 'name') between 1 and 80
      and (topic ->> 'name') = btrim(topic ->> 'name')
      and topic ->> 'name' !~ '[[:cntrl:]]', false)
  ) or exists (
    select 1 from jsonb_array_elements(p_topics) topic
    group by topic ->> 'id' having count(*) > 1
  ) or exists (
    select 1 from jsonb_array_elements(p_topics) topic
    group by lower(topic ->> 'name') having count(*) > 1
  ) then
    raise exception 'Invalid category topics' using errcode = '22023';
  end if;

  if p_product_ids is not null then
    product_ids := array(select id from public.catalog_products
      where category_name = current_category.name order by display_order nulls last, created_at, id);
    if p_expected_product_ids is distinct from product_ids or
      array(select v from unnest(p_product_ids) v order by v) is distinct from
      array(select v from unnest(product_ids) v order by v) then
      raise sqlstate 'PT409' using message = 'Product order changed';
    end if;
  end if;

  if p_category_ids is not null then
    category_ids := array(select id from public.catalog_categories order by display_order nulls last, position);
    if p_expected_category_ids is distinct from category_ids or
      array(select v from unnest(p_category_ids) v order by v) is distinct from
      array(select v from unnest(category_ids) v order by v) then
      raise sqlstate 'PT409' using message = 'Category order changed';
    end if;
  end if;

  set constraints public.catalog_products_category_name_fkey deferred;
  update public.catalog_categories set name = p_name, topics = p_topics, revision = revision + 1 where id = p_id;

  if p_name is distinct from current_category.name or p_topics is distinct from current_category.topics then
    update public.catalog_products p
    set details = jsonb_set(p.details, '{category}', to_jsonb(p_name))
      || case when p.details ? 'orderMode' then '{}'::jsonb else jsonb_build_object(
        'orderMode', case when p.details -> 'configuravel' = 'true'::jsonb then current_category.order_mode else 'simple' end
      ) end
    where p.category_name = current_category.name;
  end if;

  if p_product_ids is not null then
    update public.catalog_products p set display_order = item.ordinality
    from unnest(p_product_ids) with ordinality item(id, ordinality)
    where p.id = item.id and p.display_order is distinct from item.ordinality;
  end if;

  if p_category_ids is not null then
    update public.catalog_categories c set display_order = item.ordinality
    from unnest(p_category_ids) with ordinality item(id, ordinality)
    where c.id = item.id and c.display_order is distinct from item.ordinality;
  end if;
  set constraints public.catalog_products_category_name_fkey immediate;
end;
$$;

create function presente_doce_private.delete_catalog_category(p_id uuid, p_revision integer, p_destination uuid)
returns void language plpgsql security definer set search_path = ''
as $$
declare
  source public.catalog_categories%rowtype;
  destination public.catalog_categories%rowtype;
begin
  perform presente_doce_private.require_catalog_admin();
  lock table public.catalog_categories, public.catalog_products in share row exclusive mode;
  select * into source from public.catalog_categories where id = p_id;
  if not found or source.revision is distinct from p_revision then
    raise sqlstate 'PT409' using message = 'Category changed';
  end if;

  if exists (select 1 from public.catalog_products where category_name = source.name) then
    select * into destination from public.catalog_categories where id = p_destination and id <> p_id;
    if not found then raise exception 'Choose a destination category' using errcode = '22023'; end if;
    update public.catalog_products p
    set details = p.details || jsonb_build_object(
        'category', destination.name,
        'orderMode', coalesce(p.details ->> 'orderMode',
          case when p.details -> 'configuravel' = 'true'::jsonb then source.order_mode else 'simple' end),
        'topicIds', coalesce((
          select jsonb_agg(t -> 'id')
          from jsonb_array_elements(destination.topics) t
          where exists (
            select 1 from jsonb_array_elements_text(coalesce(p.details -> 'tags', '[]'::jsonb)) tag
            where lower(btrim(tag.value)) = lower(t ->> 'name')
          )
        ), '[]'::jsonb)
      ),
      display_order = null
    where p.category_name = source.name;
  end if;

  delete from public.catalog_categories where id = p_id;
end;
$$;

create function public.catalog_category_details()
returns jsonb language sql stable security invoker set search_path = ''
as $$ select presente_doce_private.catalog_category_details(); $$;

create function public.save_catalog_category(
  p_id uuid, p_revision integer, p_name text, p_topics jsonb,
  p_product_ids text[] default null, p_expected_product_ids text[] default null,
  p_category_ids uuid[] default null, p_expected_category_ids uuid[] default null
)
returns void language sql security invoker set search_path = ''
as $$
  select presente_doce_private.save_catalog_category(
    p_id, p_revision, p_name, p_topics, p_product_ids, p_expected_product_ids, p_category_ids, p_expected_category_ids);
$$;

create function public.delete_catalog_category(p_id uuid, p_revision integer, p_destination uuid default null)
returns void language sql security invoker set search_path = ''
as $$ select presente_doce_private.delete_catalog_category(p_id, p_revision, p_destination); $$;

revoke all on function public.catalog_category_details(), presente_doce_private.catalog_category_details(),
  public.save_catalog_category(uuid, integer, text, jsonb, text[], text[], uuid[], uuid[]),
  presente_doce_private.save_catalog_category(uuid, integer, text, jsonb, text[], text[], uuid[], uuid[]),
  public.delete_catalog_category(uuid, integer, uuid), presente_doce_private.delete_catalog_category(uuid, integer, uuid)
  from public, anon, authenticated;

grant execute on function public.catalog_category_details(), presente_doce_private.catalog_category_details(),
  public.save_catalog_category(uuid, integer, text, jsonb, text[], text[], uuid[], uuid[]),
  presente_doce_private.save_catalog_category(uuid, integer, text, jsonb, text[], text[], uuid[], uuid[]),
  public.delete_catalog_category(uuid, integer, uuid), presente_doce_private.delete_catalog_category(uuid, integer, uuid)
  to authenticated;

commit;
