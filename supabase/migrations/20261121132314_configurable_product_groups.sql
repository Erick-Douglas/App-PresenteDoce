begin;
set local lock_timeout='5s';
alter table public.catalog_categories add column option_groups jsonb not null default '[]';

create function presente_doce_private.valid_option_groups(groups jsonb) returns boolean language plpgsql immutable set search_path='' as $$
declare g jsonb;o jsonb;ids text[]:='{}';all_options text[]:='{}';names text[];lim record;
begin
 if jsonb_typeof(groups) is distinct from 'array' or jsonb_array_length(groups)>10 then return false;end if;
 for g in select value from jsonb_array_elements(groups) loop
  if jsonb_typeof(g) is distinct from 'object' or coalesce(g->>'id','') !~ '^[a-f0-9-]{36}$' or g->>'id'=any(ids)
   or length(btrim(coalesce(g->>'title',''))) not between 1 and 80 or jsonb_typeof(g->'options') is distinct from 'array'
   or jsonb_array_length(g->'options') not between 1 and 30 or coalesce(g->>'min','') !~ '^[0-9]{1,2}$' or coalesce(g->>'max','') !~ '^[0-9]{1,2}$'
   or (g->>'min')::int>(g->>'max')::int or (g->>'max')::int not between 1 and jsonb_array_length(g->'options')
   or (g ? 'legacyKey' and g->>'legacyKey' not in('variant','massa','recheios','flavors')) then return false;end if;
  perform (g->>'id')::uuid;ids:=array_append(ids,g->>'id');names:='{}';
  for o in select value from jsonb_array_elements(g->'options') loop
   if coalesce(o->>'id','') !~ '^[a-f0-9-]{36}$' or o->>'id'=any(ids) or length(btrim(coalesce(o->>'label',''))) not between 1 and 80
    or lower(btrim(o->>'label'))=any(names) or coalesce(o->>'extraCents','') !~ '^[0-9]{1,7}$' then return false;end if;
   perform (o->>'id')::uuid;ids:=array_append(ids,o->>'id');all_options:=array_append(all_options,o->>'id');names:=array_append(names,lower(btrim(o->>'label')));
  end loop;
 end loop;
 for g in select value from jsonb_array_elements(groups) loop
  if g ? 'maxByOption' then
   if jsonb_typeof(g->'maxByOption')<>'object' then return false;end if;
   for lim in select * from jsonb_each_text(g->'maxByOption') loop
    if not lim.key=any(all_options) or lim.value !~ '^[0-9]{1,2}$' or lim.value::int<(g->>'min')::int or lim.value::int>(g->>'max')::int then return false;end if;
   end loop;
  end if;
 end loop;
 return true;
exception when others then return false;
end $$;
revoke all on function presente_doce_private.valid_option_groups(jsonb) from public,anon;
grant execute on function presente_doce_private.valid_option_groups(jsonb) to authenticated;
alter table public.catalog_categories add constraint category_option_groups_valid check(presente_doce_private.valid_option_groups(option_groups));
grant select(option_groups) on public.catalog_categories to anon,authenticated;
grant update(option_groups) on public.catalog_categories to authenticated;

-- Preserve existing labels as free optional choices; do not invent prices or remove legacy data.
update public.catalog_categories c set option_groups=jsonb_build_array(jsonb_build_object('id',gen_random_uuid(),'title','Opções','min',0,'max',1,'options',
 (select jsonb_agg(jsonb_build_object('id',t->>'id','label',t->>'name','extraCents',0)) from jsonb_array_elements(c.topics) t)))
 where jsonb_array_length(c.topics)>0;
update public.catalog_products p set details=p.details||jsonb_build_object('optionGroupsMode',case when jsonb_array_length(coalesce(p.details->'topicIds','[]'))=jsonb_array_length(c.topics) then 'category' else 'product' end,
 'optionGroups',coalesce((select jsonb_agg(g||jsonb_build_object('options',(select jsonb_agg(o) from jsonb_array_elements(g->'options') o where p.details->'topicIds' ? (o->>'id'))))
 from jsonb_array_elements(c.option_groups) g where exists(select 1 from jsonb_array_elements(g->'options') o where p.details->'topicIds' ? (o->>'id'))),'[]'))
 from public.catalog_categories c where c.store_id=p.store_id and c.name=p.details->>'category' and coalesce(p.details->>'orderMode','simple')='simple';

create function presente_doce_private.sync_product_options() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if new.details->>'optionGroupsMode'='category' then
  new.details:=new.details||jsonb_build_object('optionGroups',coalesce((select c.option_groups from public.catalog_categories c where c.store_id=new.store_id and c.name=new.details->>'category'),'[]'));
 end if;
 if new.details ? 'optionGroups' and not presente_doce_private.valid_option_groups(new.details->'optionGroups') then raise exception 'Confira os títulos, opções, preços e limites dos grupos.' using errcode='22023';end if;
 if new.details ? 'optionGroupsMode' and new.details->>'optionGroupsMode' not in('category','product') then raise exception 'Origem dos grupos inválida.';end if;
 return new;
end $$;
revoke all on function presente_doce_private.sync_product_options() from public,anon,authenticated;
create trigger sync_product_options before insert or update of details on public.catalog_products for each row execute function presente_doce_private.sync_product_options();
create function presente_doce_private.sync_category_options() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if old.option_groups is distinct from new.option_groups then
  update public.catalog_products p set details=p.details||jsonb_build_object('optionGroups',new.option_groups)
   where p.store_id=new.store_id and p.details->>'category'=new.name and p.details->>'optionGroupsMode'='category';
 end if;return new;
end $$;
revoke all on function presente_doce_private.sync_category_options() from public,anon,authenticated;
create trigger sync_category_options after update of option_groups on public.catalog_categories for each row execute function presente_doce_private.sync_category_options();

create function public.save_catalog_configuration(p_payload jsonb) returns jsonb language plpgsql security invoker set search_path='' as $$
declare sid uuid:=presente_doce_private.current_store_id();result jsonb;
begin
 if p_payload ? 'p_option_groups' and not presente_doce_private.valid_option_groups(p_payload->'p_option_groups') then raise exception 'Confira os grupos e opções da categoria.';end if;
 perform public.save_catalog_category((p_payload->>'p_id')::uuid,(p_payload->>'p_revision')::int,p_payload->>'p_name',coalesce(p_payload->'p_topics','[]'),
 case when jsonb_typeof(p_payload->'p_product_ids')='array' then array(select jsonb_array_elements_text(p_payload->'p_product_ids')) end,
 case when jsonb_typeof(p_payload->'p_expected_product_ids')='array' then array(select jsonb_array_elements_text(p_payload->'p_expected_product_ids')) end,
 case when jsonb_typeof(p_payload->'p_category_ids')='array' then array(select jsonb_array_elements_text(p_payload->'p_category_ids')::uuid) end,
 case when jsonb_typeof(p_payload->'p_expected_category_ids')='array' then array(select jsonb_array_elements_text(p_payload->'p_expected_category_ids')::uuid) end);
 if p_payload ? 'p_option_groups' then update public.catalog_categories set option_groups=p_payload->'p_option_groups' where id=(p_payload->>'p_id')::uuid and store_id=sid;end if;
 select to_jsonb(c) into result from public.catalog_categories c where c.id=(p_payload->>'p_id')::uuid and c.store_id=sid;
 return result;
end $$;
revoke all on function public.save_catalog_configuration(jsonb) from public,anon;
grant execute on function public.save_catalog_configuration(jsonb) to authenticated;

create function presente_doce_private.resolve_product_options(groups jsonb,configuration jsonb,p_variant text) returns jsonb language plpgsql immutable set search_path='' as $$
declare g jsonb;o jsonb;chosen jsonb;selections jsonb:=coalesce(configuration->'selections','{}');labels jsonb:='[]';options_labels jsonb;extra bigint:=0;group_extra bigint;max_choices integer;variant_label text:='';r record;
begin
 if not presente_doce_private.valid_option_groups(groups) or jsonb_typeof(selections) is distinct from 'object' then raise exception 'Personalização inválida.';end if;
 if exists(select 1 from jsonb_object_keys(selections) k where not exists(select 1 from jsonb_array_elements(groups) available_group where available_group->>'id'=k)) then raise exception 'Um grupo de opções já não existe.';end if;
 -- Older clients may still send legacy labels; map only explicitly marked stored groups.
 if not configuration ? 'selections' then
  for g in select value from jsonb_array_elements(groups) loop
   select coalesce(jsonb_agg(opt->'id'),'[]') into chosen from jsonb_array_elements(g->'options') opt where
    case g->>'legacyKey' when 'variant' then opt->>'label'=p_variant when 'massa' then opt->>'label'=configuration->>'massa'
     when 'recheios' then opt->>'label' in(configuration->>'recheio1',configuration->>'recheio2')
     when 'flavors' then coalesce(configuration->'selectedFlavors','[]') ? (opt->>'label') else false end;
   selections:=jsonb_set(selections,array[g->>'id'],chosen);
  end loop;
 end if;
 for g in select value from jsonb_array_elements(groups) loop
  chosen:=coalesce(selections->(g->>'id'),'[]');max_choices:=(g->>'max')::int;
  if jsonb_typeof(chosen) is distinct from 'array' then raise exception 'Opções inválidas em %.',g->>'title';end if;
  if g ? 'maxByOption' then
   for r in select * from jsonb_each_text(g->'maxByOption') loop
    if exists(select 1 from jsonb_each(selections) s cross join lateral jsonb_array_elements_text(s.value) v where v=r.key) then max_choices:=least(max_choices,r.value::int);end if;
   end loop;
  end if;
  if jsonb_array_length(chosen)<(g->>'min')::int or jsonb_array_length(chosen)>max_choices then raise exception 'Escolha entre % e % em %.',g->>'min',max_choices,g->>'title';end if;
  if (select count(*) from jsonb_array_elements_text(chosen))<>(select count(distinct value) from jsonb_array_elements_text(chosen)) or exists(select 1 from jsonb_array_elements_text(chosen) picked where not exists(select 1 from jsonb_array_elements(g->'options') available_option where available_option->>'id'=picked)) then raise exception 'Uma opção de % já não está disponível.',g->>'title';end if;
  options_labels:='[]';group_extra:=0;
  for o in select value from jsonb_array_elements(g->'options') loop
   if chosen ? (o->>'id') then
    group_extra:=group_extra+(o->>'extraCents')::bigint;options_labels:=options_labels||jsonb_build_array(jsonb_build_object('label',o->>'label','extraCents',(o->>'extraCents')::int));
    if g->>'legacyKey'='variant' then variant_label:=o->>'label';end if;
   end if;
  end loop;
  if jsonb_array_length(options_labels)>0 then labels:=labels||jsonb_build_array(jsonb_build_object('title',g->>'title','options',options_labels));end if;
  extra:=extra+group_extra;
 end loop;
 return jsonb_build_object('extra_cents',extra,'labels',labels,'selections',selections,'variant',variant_label);
end $$;
revoke all on function presente_doce_private.resolve_product_options(jsonb,jsonb,text) from public,anon,authenticated;
CREATE OR REPLACE FUNCTION presente_doce_private.create_order(p_store uuid, p_payload jsonb, p_manual boolean, p_client text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare resolved_options jsonb;item_configuration jsonb;config jsonb;store public.stores;old public.orders;o public.orders;line jsonb;product public.catalog_products;variant jsonb;
 recipe_id uuid;cake_option jsonb;choice_field text;label text;cid uuid;day date;today date;unit bigint;total bigint:=0;fee integer:=0;v_delivery_pending boolean:=false;units integer:=0;qty integer;mode text;option_key text;
 v_order_id uuid:=gen_random_uuid();key uuid;fingerprint text;quote boolean;customer jsonb;bucket text;hits integer;cost bigint;recipe jsonb;
begin
 if p_manual and (p_store<>presente_doce_private.require_store_write()) then raise exception 'Loja inválida.';end if;
 select * into strict store from public.stores where id=p_store;
 if not p_manual and (not store.visible or not exists(select 1 from public.store_entitlements where store_id=p_store and
  (status='internal' or (status in('trial','active') and (expires_at is null or expires_at>now()))))) then raise exception 'A loja não está a receber encomendas.';end if;
 if jsonb_typeof(p_payload)<>'object' or pg_column_size(p_payload)>32768 or jsonb_typeof(p_payload->'items') is distinct from 'array'
 or jsonb_array_length(p_payload->'items') not between 1 and 50 then raise exception 'Confira os itens da encomenda.';end if;
 key:=(p_payload->>'idempotency_key')::uuid;fingerprint:=encode(sha256(convert_to(p_payload::text,'UTF8')),'hex');
 if key is null then raise exception 'Identificação da tentativa em falta.';end if;
 perform pg_advisory_xact_lock(hashtextextended(p_store::text||key::text,1));
 select * into old from public.orders where store_id=p_store and idempotency_key=key;
 if found then if old.payload_hash<>fingerprint then raise exception 'Esta tentativa já contém outro pedido.';end if;
 return jsonb_build_object('id',old.id,'reference',old.reference,'total_cents',old.total_cents,'deposit_cents',old.deposit_cents,'status',old.status,'currency',old.currency,'delivery_pending',old.delivery_pending);end if;
 select settings into strict config from public.store_settings where store_id=p_store;
 if not p_manual and coalesce(config->>'whatsapp','') !~ '^[+0-9 ()-]{6,30}$' then raise exception 'A loja ainda precisa configurar o contato para encomendas.';end if;
 today:=(now() at time zone store.timezone)::date;day:=(p_payload->>'delivery_date')::date;
 if day is null or day<today or day>today+366 then raise exception 'Escolha uma data válida no próximo ano.';end if;
 if coalesce(p_payload->>'fulfillment','') not in('pickup','delivery') then raise exception 'Escolha recolha ou entrega.';end if;
 if p_payload->>'fulfillment'='delivery' then
  if not coalesce((config->>'delivery_enabled')::boolean,false) then raise exception 'A entrega não está disponível.';end if;
  if length(btrim(coalesce(p_payload->'customer'->>'address','')))<5 then raise exception 'Informe a morada para entrega.';end if;
  fee:=coalesce((config->>'delivery_fee_cents')::integer,0);v_delivery_pending:=config->'delivery_fee_cents'='null'::jsonb;
 end if;
 customer:=p_payload->'customer';
 if length(btrim(coalesce(customer->>'name',''))) not between 1 and 100 or coalesce(customer->>'phone','') !~ '^[+0-9 ()-]{6,30}$'
 or length(coalesce(customer->>'email',''))>254 or length(coalesce(customer->>'address',''))>500 or length(coalesce(p_payload->>'notes',''))>2000 then raise exception 'Confira nome, telefone, morada e observações.';end if;
 quote:=p_manual and coalesce(p_payload->>'kind','order')='quote';
 if nullif(p_payload->>'customer_id','') is not null and p_manual then
  cid:=(p_payload->>'customer_id')::uuid;
  if not exists(select 1 from public.customers where store_id=p_store and id=cid) then raise exception 'Cliente não encontrado nesta loja.';end if;
 else
  -- An incoming public contact does not overwrite an existing customer's private CRM notes.
  insert into public.customers(store_id,name,phone,email,address) values(p_store,btrim(customer->>'name'),customer->>'phone',coalesce(customer->>'email',''),coalesce(customer->>'address','')) returning customers.id into cid;
 end if;
 insert into public.orders(id,store_id,customer_id,kind,status,delivery_date,fulfillment,customer_snapshot,notes,total_cents,deposit_cents,currency,idempotency_key,payload_hash,hold_until)
 values(v_order_id,p_store,cid,case when quote then 'quote' else 'order' end,case when quote then 'draft' when p_manual then 'confirmed' else 'pending' end,
 day,p_payload->>'fulfillment',customer,coalesce(p_payload->>'notes',''),0,0,store.currency,key,fingerprint,case when not p_manual then now()+interval '30 minutes' end);
 for line in select value from jsonb_array_elements(p_payload->'items') loop
  qty:=(line->>'quantity')::integer;mode:=coalesce(line->>'mode','preorder');option_key:=coalesce(line->>'variant','');
  if qty is null or qty not between 1 and 1000 or mode not in('ready','preorder') then raise exception 'Quantidade ou modalidade inválida.';end if;
  select * into product from public.catalog_products where store_id=p_store and id=line->>'product_id';
  if not found or (not p_manual and not product.published) then raise exception 'Um produto já não está disponível.';end if;
  if not coalesce(product.details->'saleModes','["preorder"]'::jsonb) ? mode then raise exception 'Esta modalidade não está disponível para o produto.';end if;
  if mode='ready' and day<>today then raise exception 'Pronta entrega é para hoje. Separe os pedidos por modalidade/data.';end if;
  if not p_manual and mode='preorder' and day<today+coalesce((config->>'lead_days')::integer,1) then raise exception 'A data não respeita a antecedência da loja.';end if;
  item_configuration:=coalesce(line->'configuration','{}');
  if jsonb_typeof(item_configuration)<>'object' or pg_column_size(item_configuration)>16384 then raise exception 'Personalização inválida.';end if;
  if product.details ? 'optionGroups' then
   resolved_options:=presente_doce_private.resolve_product_options(product.details->'optionGroups',item_configuration,option_key);
   unit:=round((product.details->>'price')::numeric*100)+(resolved_options->>'extra_cents')::bigint;
   option_key:=resolved_options->>'variant';
   item_configuration:=jsonb_build_object('selections',resolved_options->'selections','option_labels',resolved_options->'labels','observations',coalesce(item_configuration->>'observations',''));
  else
  if jsonb_array_length(coalesce(product.details->'variants','[]'))>0 then
   select v into variant from jsonb_array_elements(product.details->'variants') v where v->>'label'=option_key;
   if variant is null then raise exception 'Escolha uma opção válida do produto.';end if;
   unit:=round((variant->>'price')::numeric*100);
  else if option_key<>'' then raise exception 'Opção de produto inválida.';end if;unit:=round((product.details->>'price')::numeric*100);end if;
  if jsonb_typeof(coalesce(line->'configuration','{}'))<>'object' or pg_column_size(coalesce(line->'configuration','{}'))>4096 then raise exception 'Personalização inválida.';end if;
  if product.details->>'orderMode'='cake' then
   foreach choice_field in array array['massa','recheio1','recheio2'] loop
    label:=coalesce(line->'configuration'->>choice_field,'');
    if label='' and choice_field='recheio2' then continue;end if;
    select v into cake_option from jsonb_array_elements(config->case when choice_field='massa' then 'cake_masses' else 'cake_fillings' end) v
     where case when jsonb_typeof(v)='string' then v#>>'{}' else v->>'label' end=label;
    if cake_option is null then raise exception 'Selecione uma massa e recheio disponíveis.';end if;
    if choice_field<>'recheio2' or label is distinct from line->'configuration'->>'recheio1' then unit:=unit+coalesce((cake_option->>'extra_cents')::integer,0);end if;
   end loop;
  end if;
  if product.details ? 'flavors' and line->'configuration' ? 'selectedFlavors' then
   if jsonb_typeof(line->'configuration'->'selectedFlavors')<>'array'
   or jsonb_array_length(line->'configuration'->'selectedFlavors')>coalesce((variant->>'maxFlavors')::integer,100)
   or exists(select 1 from jsonb_array_elements_text(line->'configuration'->'selectedFlavors') f where not product.details->'flavors' ? f) then raise exception 'Confira os sabores selecionados.';end if;
  end if;
  end if;
  if unit<=0 then raise exception 'Um produto está sem preço de venda válido.';end if;
  cost:=null;
  select r.id,r.recipe into recipe_id,recipe from public.pricing_recipes r where r.store_id=p_store and r.product_id=product.id
   and coalesce(r.recipe->>'variant','')=option_key order by r.updated_at desc limit 1;
  if recipe is not null then
   cost:=round(presente_doce_private.recipe_cost(p_store,recipe_id)/replace(recipe->>'yieldCount',',','.')::numeric*100);
  end if;
  insert into public.order_items(store_id,order_id,product_id,option_key,quantity,mode,unit_cents,unit_cost_cents,snapshot,configuration)
   values(p_store,v_order_id,product.id,option_key,qty,mode,unit,cost,jsonb_build_object('name',product.details->'name','image',product.details->'image','category',product.details->'category'),item_configuration);
  total:=total+unit*qty;if mode='preorder' then units:=units+qty*coalesce((product.details->>'capacityUnits')::integer,1);end if;
 end loop;
 total:=total+fee;
 update public.orders set total_cents=total,delivery_cents=fee,delivery_pending=v_delivery_pending,deposit_percent=(config->>'deposit_percent')::integer,deposit_cents=round(total*coalesce((config->>'deposit_percent')::numeric,50)/100),
 capacity_units=units where orders.id=v_order_id returning * into o;
 perform presente_doce_private.expire_holds(p_store);
 if not quote then perform presente_doce_private.reserve_order(v_order_id);end if;
 insert into public.audit_events(store_id,actor,action,entity_id) values(p_store,auth.uid(),'order.create',v_order_id::text);
 select * into o from public.orders where id=v_order_id; return jsonb_build_object('version',o.version,'id',v_order_id,'reference',o.reference,'total_cents',total,'deposit_cents',o.deposit_cents,'status',o.status,'currency',o.currency,'delivery_pending',o.delivery_pending);
end $function$;

commit;
