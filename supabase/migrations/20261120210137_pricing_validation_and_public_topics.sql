begin;
grant select(topics) on public.catalog_categories to anon, authenticated;

create or replace function presente_doce_private.valid_pricing_recipe(p_recipe jsonb)
returns boolean language plpgsql immutable set search_path = '' as $fn$
declare item jsonb; field text; number_text text;
begin
 if jsonb_typeof(p_recipe) is distinct from 'object' or pg_column_size(p_recipe)>65536
 or jsonb_typeof(p_recipe->'title') is distinct from 'string' or length(btrim(p_recipe->>'title'))>100
 or jsonb_typeof(p_recipe->'ingredients') is distinct from 'array' then return false; end if;
 if jsonb_array_length(p_recipe->'ingredients') not between 1 and 70 then return false; end if;
 foreach field in array array['yieldCount','salePrice'] loop
   if jsonb_typeof(p_recipe->field) is distinct from 'string' then return false; end if;
   number_text := replace(btrim(p_recipe->>field),',','.');
   if number_text !~ '^[0-9]{1,9}([.][0-9]{1,6})?$' then return false; end if;
   if (field='yieldCount' and number_text::numeric<=0) then return false; end if;
 end loop;
 for item in select value from jsonb_array_elements(p_recipe->'ingredients') loop
   if jsonb_typeof(item) is distinct from 'object'
   or jsonb_typeof(item->'name') is distinct from 'string'
   or length(btrim(item->>'name')) not between 1 and 100
   or coalesce(item->>'unit','') not in ('g','ml','un') then return false; end if;
   foreach field in array array['packQuantity','packPrice','usedQuantity'] loop
     if jsonb_typeof(item->field) is distinct from 'string' then return false; end if;
     number_text := replace(btrim(item->>field),',','.');
     if number_text !~ '^[0-9]{1,9}([.][0-9]{1,6})?$' then return false; end if;
     if field<>'packPrice' and number_text::numeric<=0 then return false; end if;
   end loop;
 end loop;
 return true;
end
$fn$;
revoke all on function presente_doce_private.valid_pricing_recipe(jsonb) from public,anon;
grant execute on function presente_doce_private.valid_pricing_recipe(jsonb) to authenticated;
alter table public.pricing_recipes add constraint complete_pricing_recipe
 check (presente_doce_private.valid_pricing_recipe(recipe));
commit;
