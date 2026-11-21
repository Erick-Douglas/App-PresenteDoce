begin;
set local lock_timeout='5s';
alter table public.customers add column birth_date date check (birth_date is null or birth_date <= current_date);
grant insert(birth_date), update(birth_date) on public.customers to authenticated;
-- Optional personal data stays inside the existing private customer RLS boundary.
CREATE OR REPLACE FUNCTION presente_doce_private.create_order(p_store uuid, p_payload jsonb, p_manual boolean, p_client text DEFAULT ''::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO ''
AS $function$
declare delivery_at_value timestamptz;delivery_time_value text;notice_hours integer;resolved_options jsonb;item_configuration jsonb;config jsonb;store public.stores;old public.orders;o public.orders;line jsonb;product public.catalog_products;variant jsonb;
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
 delivery_time_value:=p_payload->>'delivery_time';
 if delivery_time_value is not null and delivery_time_value !~ '^([01][0-9]|2[0-3]):[0-5][0-9]$' then raise exception 'Escolha um horário válido.';end if;
 if coalesce((config->>'preorder_only')::boolean,false) then
  if delivery_time_value is null then raise exception 'Atualize a aplicação e escolha a data e o horário no checkout.';end if;
  delivery_at_value:=(day::text||' '||delivery_time_value)::timestamp at time zone store.timezone;
  notice_hours:=greatest(48,coalesce((config->>'min_notice_hours')::integer,48));
  if delivery_at_value<now()+make_interval(hours=>notice_hours) then raise exception 'Escolha data e horário com pelo menos % horas de antecedência.',notice_hours;end if;
 elsif delivery_time_value is not null then delivery_at_value:=(day::text||' '||delivery_time_value)::timestamp at time zone store.timezone;
 end if;
 if coalesce(p_payload->>'fulfillment','') not in('pickup','delivery') then raise exception 'Escolha recolha ou entrega.';end if;
 if p_payload->>'fulfillment'='delivery' then
  if not coalesce((config->>'delivery_enabled')::boolean,false) then raise exception 'A entrega não está disponível.';end if;
  if length(btrim(coalesce(p_payload->'customer'->>'address','')))<5 then raise exception 'Informe a morada para entrega.';end if;
  fee:=coalesce((config->>'delivery_fee_cents')::integer,0);v_delivery_pending:=config->'delivery_fee_cents'='null'::jsonb;
 end if;
 customer:=p_payload->'customer';
 if nullif(customer->>'birth_date','') is not null then
  if (customer->>'birth_date') !~ '^[0-9]{4}-[0-9]{2}-[0-9]{2}$' or (customer->>'birth_date')::date>today then raise exception 'Confira a data de nascimento.';end if;
 end if;
 if length(btrim(coalesce(customer->>'name',''))) not between 1 and 100 or coalesce(customer->>'phone','') !~ '^[+0-9 ()-]{6,30}$'
 or length(coalesce(customer->>'email',''))>254 or length(coalesce(customer->>'address',''))>500 or length(coalesce(p_payload->>'notes',''))>2000 then raise exception 'Confira nome, telefone, morada e observações.';end if;
 quote:=p_manual and coalesce(p_payload->>'kind','order')='quote';
 if nullif(p_payload->>'customer_id','') is not null and p_manual then
  cid:=(p_payload->>'customer_id')::uuid;
  if not exists(select 1 from public.customers where store_id=p_store and id=cid) then raise exception 'Cliente não encontrado nesta loja.';end if;
 else
  -- An incoming public contact does not overwrite an existing customer's private CRM notes.
  insert into public.customers(store_id,name,phone,email,address,birth_date) values(p_store,btrim(customer->>'name'),customer->>'phone',coalesce(customer->>'email',''),coalesce(customer->>'address',''),nullif(customer->>'birth_date','')::date) returning customers.id into cid;
 end if;
 insert into public.orders(id,store_id,customer_id,kind,status,delivery_date,delivery_time,delivery_at,fulfillment,customer_snapshot,notes,total_cents,deposit_cents,currency,idempotency_key,payload_hash,hold_until)
 values(v_order_id,p_store,cid,case when quote then 'quote' else 'order' end,case when quote then 'draft' when p_manual then 'confirmed' else 'pending' end,
 day,delivery_time_value,delivery_at_value,p_payload->>'fulfillment',customer,coalesce(p_payload->>'notes',''),0,0,store.currency,key,fingerprint,case when not p_manual then now()+interval '30 minutes' end);
 for line in select value from jsonb_array_elements(p_payload->'items') loop
  qty:=(line->>'quantity')::integer;mode:=coalesce(line->>'mode','preorder');option_key:=coalesce(line->>'variant','');
  if qty is null or qty not between 1 and 1000 or mode not in('ready','preorder') then raise exception 'Quantidade ou modalidade inválida.';end if;
  select * into product from public.catalog_products where store_id=p_store and id=line->>'product_id';
  if not found or (not p_manual and not product.published) then raise exception 'Um produto já não está disponível.';end if;
  if coalesce((config->>'preorder_only')::boolean,false) and mode<>'preorder' then raise exception 'A loja trabalha apenas por encomenda. A pronta entrega está desativada.';end if;
  if not coalesce((config->>'preorder_only')::boolean,false) and not coalesce(product.details->'saleModes','["preorder"]'::jsonb) ? mode then raise exception 'Esta modalidade não está disponível para o produto.';end if;
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
