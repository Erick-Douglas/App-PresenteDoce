begin;
create or replace function presente_doce_private.resolve_recipe() returns trigger language plpgsql security definer set search_path='' as $$
declare i jsonb;items jsonb:='[]';ing public.ingredients;child public.pricing_recipes;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.store_id::text,6));
 for i in select value from jsonb_array_elements(new.recipe->'ingredients') loop
  if nullif(i->>'ingredientId','') is not null and nullif(i->>'recipeId','') is not null then raise exception 'Use ingrediente ou sub-receita, não ambos na mesma linha.';end if;
  if nullif(i->>'ingredientId','') is not null then
   select * into ing from public.ingredients where store_id=new.store_id and id=(i->>'ingredientId')::uuid;
   if not found then raise exception 'Ingrediente não encontrado nesta loja.';end if;
   i:=i||jsonb_build_object('name',ing.name,'unit',ing.unit,'packQuantity',ing.pack_quantity::text,'packPrice',trim_scale(round(ing.pack_price_cents::numeric/100,6))::text);
  elsif nullif(i->>'recipeId','') is not null then
   if (i->>'recipeId')::uuid=new.id or exists(
    with recursive links(id) as(select (i->>'recipeId')::uuid union select (e.value->>'recipeId')::uuid from links l
    join public.pricing_recipes r on r.id=l.id and r.store_id=new.store_id cross join lateral jsonb_array_elements(r.recipe->'ingredients') e
    where nullif(e.value->>'recipeId','') is not null) select 1 from links where id=new.id) then raise exception 'Uma ficha não pode depender de si própria.';end if;
   select * into child from public.pricing_recipes where store_id=new.store_id and id=(i->>'recipeId')::uuid;
   if not found then raise exception 'Sub-receita não encontrada nesta loja.';end if;
   i:=i||jsonb_build_object('name',coalesce(nullif(child.recipe->>'title',''),'Sub-receita'),'unit','un','packQuantity',child.recipe->>'yieldCount',
    'packPrice',round(presente_doce_private.recipe_cost(new.store_id,child.id),6)::text);
  end if;
  items:=items||jsonb_build_array(i);
 end loop;
 new.recipe:=jsonb_set(new.recipe,'{ingredients}',items);return new;
end $$;

alter table public.stores alter column logo_url set default '/store-placeholder.svg';
alter table public.catalog_products add constraint product_sale_modes check (
 not(details ? 'saleModes') or (jsonb_typeof(details->'saleModes')='array' and jsonb_array_length(details->'saleModes') between 1 and 2 and details->'saleModes' <@ '["ready","preorder"]'::jsonb));
alter table public.catalog_products add constraint product_capacity_units check (
 not(details ? 'capacityUnits') or (jsonb_typeof(details->'capacityUnits')='number' and (details->>'capacityUnits') ~ '^[0-9]{1,3}$' and (details->>'capacityUnits')::integer between 0 and 100));
commit;
