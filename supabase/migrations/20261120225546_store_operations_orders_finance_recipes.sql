-- Public schema seed uses empty contact fields. Configure real contacts privately in Store Settings.
-- The operational project was initialized privately; no contact data is required to apply this schema.
begin;

create table public.store_settings(
 store_id uuid primary key default presente_doce_private.current_store_id() references public.stores(id),
 settings jsonb not null default '{"whatsapp":"","email":"","address":"","lead_days":1,"daily_capacity":8,"deposit_percent":50,"delivery_fee_cents":null,"delivery_enabled":true,"hours":"Por marcação","cake_masses":["Baunilha","Chocolate"],"cake_fillings":["Brigadeiro","Ninho"],"gallery":[]}'::jsonb,
 version integer not null default 1, updated_at timestamptz not null default now(),
 check(jsonb_typeof(settings)='object' and pg_column_size(settings)<=65536));
insert into public.store_settings(store_id,settings) values('11111111-1111-4111-a111-111111111111',
 '{"whatsapp":"","email":"","address":"","lead_days":1,"daily_capacity":8,"deposit_percent":50,"delivery_fee_cents":null,"delivery_enabled":true,"hours":"Por marcação","cake_masses":["Baunilha","Chocolate"],"cake_fillings":["Brigadeiro","Ninho"],"gallery":[]}');
create table public.customers(
 id uuid primary key default gen_random_uuid(),store_id uuid not null default presente_doce_private.current_store_id() references public.stores(id),
 name text not null check(length(btrim(name)) between 1 and 100),phone text not null check(length(phone) between 6 and 30),
 email text not null default '' check(length(email)<=254),address text not null default '' check(length(address)<=500),
 notes text not null default '' check(length(notes)<=2000),version integer not null default 1,updated_at timestamptz not null default now(),
 unique(store_id,id));
create index customer_phone on public.customers(store_id,phone);
create table public.orders(
 id uuid primary key default gen_random_uuid(),store_id uuid not null default presente_doce_private.current_store_id() references public.stores(id),
 reference bigint generated always as identity,customer_id uuid,kind text not null default 'order' check(kind in('order','quote')),
 status text not null default 'pending' check(status in('draft','pending','confirmed','production','ready','completed','canceled','expired')),
 delivery_date date not null,fulfillment text not null check(fulfillment in('pickup','delivery')),
 customer_snapshot jsonb not null,notes text not null default '' check(length(notes)<=2000),
 total_cents bigint not null check(total_cents>=0 and total_cents<=999999999),
 delivery_cents integer not null default 0 check(delivery_cents>=0),delivery_pending boolean not null default false,deposit_percent integer not null default 50 check(deposit_percent between 0 and 100),
 deposit_cents bigint not null check(deposit_cents>=0),currency text not null default 'EUR',
 capacity_units integer not null default 0 check(capacity_units>=0),reserved boolean not null default false,
 hold_until timestamptz,idempotency_key uuid not null,payload_hash text not null,
 version integer not null default 1,created_at timestamptz not null default now(),updated_at timestamptz not null default now(),
 unique(store_id,id),unique(store_id,idempotency_key),foreign key(store_id,customer_id) references public.customers(store_id,id));
create index orders_date on public.orders(store_id,delivery_date,status);
create table public.order_items(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),order_id uuid not null,
 product_id text not null,option_key text not null default '',quantity integer not null check(quantity between 1 and 1000),
 mode text not null check(mode in('ready','preorder')),unit_cents bigint not null check(unit_cents>=0),
 unit_cost_cents bigint,snapshot jsonb not null,configuration jsonb not null default '{}',
 foreign key(store_id,order_id) references public.orders(store_id,id) on delete cascade,
 foreign key(store_id,product_id) references public.catalog_products(store_id,id));
create index items_order on public.order_items(store_id,order_id);
create table public.product_stock(
 store_id uuid not null default presente_doce_private.current_store_id() references public.stores(id),
 product_id text not null,option_key text not null default '',available integer not null default 0 check(available>=0),
 primary key(store_id,product_id,option_key),foreign key(store_id,product_id) references public.catalog_products(store_id,id));
create table public.stock_movements(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),product_id text not null,
 option_key text not null default '',delta integer not null check(delta<>0),reason text not null,order_id uuid,actor uuid,
 created_at timestamptz not null default now(),foreign key(store_id,product_id) references public.catalog_products(store_id,id),
 foreign key(store_id,order_id) references public.orders(store_id,id));
create table public.calendar_blocks(
 store_id uuid not null default presente_doce_private.current_store_id() references public.stores(id),
 day date not null,blocked boolean not null default true,capacity integer check(capacity>=0 and capacity<=10000),
 reason text not null default '' check(length(reason)<=200),primary key(store_id,day));
create table public.finance_entries(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),order_id uuid,
 type text not null check(type in('receipt','refund','expense')),amount_cents bigint not null check(amount_cents>0 and amount_cents<=999999999),
 description text not null check(length(description) between 1 and 200),method text not null default 'manual' check(length(method)<=40),
 day date not null default current_date,idempotency_key uuid not null,actor uuid,created_at timestamptz not null default now(),
 unique(store_id,idempotency_key),foreign key(store_id,order_id) references public.orders(store_id,id));
create index finance_day on public.finance_entries(store_id,day);
create table public.ingredients(
 id uuid primary key default gen_random_uuid(),store_id uuid not null default presente_doce_private.current_store_id() references public.stores(id),
 name text not null check(length(btrim(name)) between 1 and 100),brand text not null default '',unit text not null check(unit in('g','ml','un')),
 pack_quantity numeric not null check(pack_quantity>0),pack_price_cents bigint not null check(pack_price_cents>=0),
 stock_quantity numeric not null default 0 check(stock_quantity>=0),version integer not null default 1,updated_at timestamptz not null default now(),
 unique(store_id,id));
create table public.audit_events(
 id uuid primary key default gen_random_uuid(),store_id uuid not null references public.stores(id),actor uuid,action text not null,entity_id text,
 created_at timestamptz not null default now(),metadata jsonb not null default '{}');
create table presente_doce_private.request_limits(
 scope text primary key,window_start timestamptz not null default now(),hits integer not null default 0);
alter table presente_doce_private.request_limits enable row level security;
revoke all on presente_doce_private.request_limits from public,anon,authenticated;
create function presente_doce_private.audit(p_action text,p_id text,p_data jsonb default '{}') returns void language sql security definer set search_path='' as $$
 insert into public.audit_events(store_id,actor,action,entity_id,metadata) values(presente_doce_private.current_store_id(),auth.uid(),p_action,p_id,p_data);
$$;
revoke all on function presente_doce_private.audit(text,text,jsonb) from public,anon,authenticated;
do $scope$
declare tab text;
begin
 foreach tab in array array['store_settings','customers','orders','order_items','product_stock','stock_movements','calendar_blocks','finance_entries','ingredients','audit_events'] loop
  execute format('alter table public.%I enable row level security',tab);
  execute format('revoke all on public.%I from public,anon,authenticated',tab);
  execute format('grant select on public.%I to authenticated',tab);
  execute format('create policy member_read on public.%I for select to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id))',tab);
  execute format('create trigger keep_store before update on public.%I for each row execute function presente_doce_private.keep_store()',tab);
 end loop;
end $scope$;
-- Only safe dictionary records have direct writes; critical mutations are transactional RPCs.
grant insert(id,name,phone,email,address,notes),update(name,phone,email,address,notes) on public.customers to authenticated;
grant insert(id,name,brand,unit,pack_quantity,pack_price_cents,stock_quantity),update(name,brand,unit,pack_quantity,pack_price_cents,stock_quantity) on public.ingredients to authenticated;
grant insert(day,blocked,capacity,reason),update(blocked,capacity,reason),delete on public.calendar_blocks to authenticated;
create policy member_write on public.customers for all to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true)) with check(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true));
create policy member_write on public.ingredients for all to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true)) with check(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true));
create policy member_write on public.calendar_blocks for all to authenticated using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true)) with check(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_member(store_id,true));
create trigger customer_version before update on public.customers for each row execute function presente_doce_private.set_catalog_version();
create trigger ingredient_version before update on public.ingredients for each row execute function presente_doce_private.set_catalog_version();

create function presente_doce_private.require_store_write() returns uuid language plpgsql stable security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.current_store_id();
begin if not presente_doce_private.is_store_member(sid,true) then raise exception 'Sem permissão ou plano ativo para esta operação.' using errcode='42501';end if;return sid;end $$;
revoke all on function presente_doce_private.require_store_write() from public,anon,authenticated;
-- Public projection omits private notes and billing information.
create function public.storefront_config() returns jsonb language sql stable security definer set search_path='' as $$
 select jsonb_build_object('store',to_jsonb(s),'settings',jsonb_build_object(
 'whatsapp',c.settings->'whatsapp','email',c.settings->'email','address',c.settings->'address','hours',c.settings->'hours',
 'lead_days',c.settings->'lead_days','delivery_enabled',c.settings->'delivery_enabled','delivery_fee_cents',c.settings->'delivery_fee_cents',
 'cake_masses',c.settings->'cake_masses','cake_fillings',c.settings->'cake_fillings','gallery',c.settings->'gallery'))
 from public.stores s join public.store_settings c on c.store_id=s.id where s.id=presente_doce_private.current_store_id() and s.visible;
$$;
revoke all on function public.storefront_config() from public;grant execute on function public.storefront_config() to anon,authenticated,service_role;
create function public.adjust_stock(p_product text,p_option text,p_delta integer,p_reason text) returns integer language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();amount integer;product public.catalog_products;
begin
 if p_delta=0 or abs(p_delta)>100000 or length(btrim(p_reason)) not between 1 and 200 then raise exception 'Indique uma quantidade e motivo válidos.';end if;
 select * into product from public.catalog_products where store_id=sid and id=p_product;
 if not found then raise exception 'Produto não encontrado.';end if;
 if jsonb_array_length(coalesce(product.details->'variants','[]'))>0 and not exists(select 1 from jsonb_array_elements(product.details->'variants') v where v->>'label'=p_option) then raise exception 'Opção inválida.';end if;
 if jsonb_array_length(coalesce(product.details->'variants','[]'))=0 and p_option<>'' then raise exception 'Opção inválida.';end if;
 insert into public.product_stock(store_id,product_id,option_key,available) values(sid,p_product,p_option,0) on conflict do nothing;
 update public.product_stock set available=available+p_delta where store_id=sid and product_id=p_product and option_key=p_option and available+p_delta>=0 returning available into amount;
 if not found then raise exception 'O estoque não pode ficar negativo.';end if;
 insert into public.stock_movements(store_id,product_id,option_key,delta,reason,actor) values(sid,p_product,p_option,p_delta,p_reason,auth.uid());
 perform presente_doce_private.audit('stock.adjust',p_product,jsonb_build_object('delta',p_delta,'option',p_option));return amount;
end $$;
revoke all on function public.adjust_stock(text,text,integer,text) from public,anon;grant execute on function public.adjust_stock(text,text,integer,text) to authenticated;

update public.store_settings set settings=jsonb_set(jsonb_set(settings,'{cake_masses}','[{"label":"Chocolate","extra_cents":0},{"label":"Massa Branca","extra_cents":0},{"label":"Cenoura","extra_cents":200},{"label":"Red Velvet","extra_cents":200}]'::jsonb),'{cake_fillings}','[{"label":"Brigadeiro Tradicional","extra_cents":0},{"label":"Brigadeiro Branco","extra_cents":0},{"label":"Doce de Leite","extra_cents":0},{"label":"Nido (Leite Ninho)","extra_cents":0},{"label":"Brigadeiro de Cream Cheese","extra_cents":200},{"label":"Doce de Leite com Ameixa","extra_cents":300},{"label":"Morango","extra_cents":300},{"label":"Maracujá","extra_cents":300},{"label":"Abacaxi","extra_cents":300},{"label":"Coco","extra_cents":300}]'::jsonb) where store_id='11111111-1111-4111-a111-111111111111';

create function presente_doce_private.release_order(p_order uuid,p_expire boolean default false) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;item public.order_items;
begin
 select * into o from public.orders where id=p_order for update;
 if not found or not o.reserved then return;end if;
 for item in select * from public.order_items where order_id=o.id and store_id=o.store_id and mode='ready' order by product_id,option_key loop
  update public.product_stock set available=available+item.quantity where store_id=o.store_id and product_id=item.product_id and option_key=item.option_key;
  insert into public.stock_movements(store_id,product_id,option_key,delta,reason,order_id,actor)
   values(o.store_id,item.product_id,item.option_key,item.quantity,'Reserva libertada',o.id,auth.uid());
 end loop;
 update public.orders set reserved=false,status=case when p_expire then 'expired' else status end,version=version+1,updated_at=now() where id=o.id;
end $$;
create function presente_doce_private.expire_holds(p_store uuid) returns void language plpgsql security definer set search_path='' as $$
declare item record;begin for item in select id from public.orders where store_id=p_store and status='pending' and reserved and hold_until<now() order by id loop
 perform presente_doce_private.release_order(item.id,true);end loop;end $$;
create function presente_doce_private.reserve_order(p_order uuid) returns void language plpgsql security definer set search_path='' as $$
declare o public.orders;config jsonb;cap integer;used integer;item public.order_items;day_block public.calendar_blocks;
begin
 select * into strict o from public.orders where id=p_order for update;
 if o.reserved then return;end if;
 perform pg_advisory_xact_lock(hashtextextended(o.store_id::text||o.delivery_date::text,0));
 select settings into strict config from public.store_settings where store_id=o.store_id;
 select * into day_block from public.calendar_blocks where store_id=o.store_id and day=o.delivery_date;
 if day_block.blocked then raise exception 'Esta data está bloqueada na agenda.';end if;
 cap:=coalesce(day_block.capacity,(config->>'daily_capacity')::integer,0);
 select coalesce(sum(capacity_units),0) into used from public.orders where store_id=o.store_id and delivery_date=o.delivery_date and reserved and status not in('canceled','expired');
 if o.capacity_units>0 and cap>0 and used+o.capacity_units>cap then raise exception 'A capacidade desta data está esgotada.';end if;
 for item in select * from public.order_items where order_id=o.id and store_id=o.store_id and mode='ready' order by product_id,option_key loop
  update public.product_stock set available=available-item.quantity where store_id=o.store_id and product_id=item.product_id and option_key=item.option_key and available>=item.quantity;
  if not found then raise exception 'Estoque insuficiente para um dos produtos.';end if;
  insert into public.stock_movements(store_id,product_id,option_key,delta,reason,order_id,actor)
   values(o.store_id,item.product_id,item.option_key,-item.quantity,'Reserva de encomenda',o.id,auth.uid());
 end loop;
 update public.orders set reserved=true,version=version+1,updated_at=now() where id=o.id;
end $$;
create function presente_doce_private.create_order(p_store uuid,p_payload jsonb,p_manual boolean,p_client text default '') returns jsonb language plpgsql security definer set search_path='' as $$
declare config jsonb;store public.stores;old public.orders;o public.orders;line jsonb;product public.catalog_products;variant jsonb;
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
  if unit<=0 then raise exception 'Um produto está sem preço de venda válido.';end if;
  cost:=null;
  select r.id,r.recipe into recipe_id,recipe from public.pricing_recipes r where r.store_id=p_store and r.product_id=product.id
   and coalesce(r.recipe->>'variant','')=option_key order by r.updated_at desc limit 1;
  if recipe is not null then
   cost:=round(presente_doce_private.recipe_cost(p_store,recipe_id)/replace(recipe->>'yieldCount',',','.')::numeric*100);
  end if;
  insert into public.order_items(store_id,order_id,product_id,option_key,quantity,mode,unit_cents,unit_cost_cents,snapshot,configuration)
   values(p_store,v_order_id,product.id,option_key,qty,mode,unit,cost,jsonb_build_object('name',product.details->'name','image',product.details->'image','category',product.details->'category'),coalesce(line->'configuration','{}'));
  total:=total+unit*qty;if mode='preorder' then units:=units+qty*coalesce((product.details->>'capacityUnits')::integer,1);end if;
 end loop;
 total:=total+fee;
 update public.orders set total_cents=total,delivery_cents=fee,delivery_pending=v_delivery_pending,deposit_percent=(config->>'deposit_percent')::integer,deposit_cents=round(total*coalesce((config->>'deposit_percent')::numeric,50)/100),
 capacity_units=units where orders.id=v_order_id returning * into o;
 perform presente_doce_private.expire_holds(p_store);
 if not quote then perform presente_doce_private.reserve_order(v_order_id);end if;
 insert into public.audit_events(store_id,actor,action,entity_id) values(p_store,auth.uid(),'order.create',v_order_id::text);
 return jsonb_build_object('id',v_order_id,'reference',o.reference,'total_cents',total,'deposit_cents',o.deposit_cents,'status',o.status,'currency',o.currency,'delivery_pending',o.delivery_pending);
end $$;
create function public.create_order_admin(p_payload jsonb) returns jsonb language sql security definer set search_path='' as $$
 select presente_doce_private.create_order(presente_doce_private.current_store_id(),p_payload,true);
$$;
create function public.checkout_order(p_store uuid,p_payload jsonb,p_client text) returns jsonb language sql security definer set search_path='' as $$
 select presente_doce_private.create_order(p_store,p_payload,false,p_client);
$$;
revoke all on function public.create_order_admin(jsonb) from public,anon;grant execute on function public.create_order_admin(jsonb) to authenticated;
revoke all on function public.checkout_order(uuid,jsonb,text) from public,anon,authenticated;grant execute on function public.checkout_order(uuid,jsonb,text) to service_role;
revoke all on function presente_doce_private.release_order(uuid,boolean),presente_doce_private.expire_holds(uuid),presente_doce_private.reserve_order(uuid),presente_doce_private.create_order(uuid,jsonb,boolean,text) from public,anon,authenticated;


create function public.change_order_status(p_id uuid,p_version integer,p_status text) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();o public.orders;
begin
 perform presente_doce_private.expire_holds(sid);
 select * into o from public.orders where store_id=sid and id=p_id for update;
 if not found or o.version<>p_version then raise sqlstate 'PT409' using message='A encomenda mudou. Atualize a lista antes de continuar.';end if;
 if p_status not in('confirmed','production','ready','completed','canceled') then raise exception 'Estado inválido.';end if;
 if p_status='canceled' then
  if o.status in('completed','canceled') then raise exception 'Esta encomenda não pode ser cancelada.';end if;
  perform presente_doce_private.release_order(o.id);
 elsif p_status='confirmed' then
  if o.delivery_pending then raise exception 'Defina a taxa de entrega antes de confirmar a encomenda.';end if;
  if o.status not in('draft','pending','expired') then raise exception 'Transição inválida.';end if;
  perform presente_doce_private.reserve_order(o.id);
 elsif p_status='production' and o.status<>'confirmed' then raise exception 'Confirme a encomenda primeiro.';
 elsif p_status='ready' and o.status not in('confirmed','production') then raise exception 'Confirme a produção primeiro.';
 elsif p_status='completed' and o.status<>'ready' then raise exception 'Marque a encomenda como pronta antes de concluir.';
 end if;
 update public.orders set status=p_status,kind=case when p_status='confirmed' then 'order' else kind end,hold_until=null,version=version+1,updated_at=now() where id=o.id returning * into o;
 perform presente_doce_private.audit('order.'||p_status,p_id::text);return to_jsonb(o);
end $$;
create function public.record_finance(p_payload jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();oid uuid:=nullif(p_payload->>'order_id','')::uuid;o public.orders;
 t text:=p_payload->>'type';amount bigint:=(p_payload->>'amount_cents')::bigint;net bigint;key uuid:=(p_payload->>'idempotency_key')::uuid;e public.finance_entries;
begin
 if t not in('receipt','refund','expense') or amount is null or amount<=0 or amount>999999999 or key is null
 or length(btrim(coalesce(p_payload->>'description',''))) not between 1 and 200 then raise exception 'Confira o tipo, montante e descrição do movimento.';end if;
 perform pg_advisory_xact_lock(hashtextextended(sid::text||key::text,2));
 select * into e from public.finance_entries where store_id=sid and idempotency_key=key;
 if found then
  if e.type<>t or e.amount_cents<>amount or e.order_id is distinct from oid then raise exception 'Identificação de movimento já utilizada.';end if;return to_jsonb(e);end if;
 if t in('receipt','refund') then
  select * into o from public.orders where store_id=sid and id=oid for update;
  if not found then raise exception 'Selecione uma encomenda desta loja.';end if;
  if t='receipt' and o.status in('draft','expired','canceled') then raise exception 'Confirme a encomenda antes de registrar o recebimento.';end if;
  select coalesce(sum(case when type='receipt' then amount_cents when type='refund' then -amount_cents else 0 end),0) into net
   from public.finance_entries where store_id=sid and order_id=oid;
  if (t='receipt' and net+amount>o.total_cents) or (t='refund' and amount>net) then raise exception 'O movimento ultrapassa o saldo disponível.';end if;
 elsif oid is not null then raise exception 'Despesa não é recebimento de encomenda.';end if;
 insert into public.finance_entries(store_id,order_id,type,amount_cents,description,method,day,idempotency_key,actor)
 values(sid,oid,t,amount,btrim(p_payload->>'description'),coalesce(nullif(p_payload->>'method',''),'manual'),coalesce(nullif(p_payload->>'day','')::date,current_date),key,auth.uid()) returning * into e;
 perform presente_doce_private.audit('finance.'||t,e.id::text,jsonb_build_object('order',oid));return to_jsonb(e);
end $$;
create function public.save_store_settings(p_version integer,p_store jsonb,p_settings jsonb) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();current_row public.store_settings;arr text;value jsonb;logo text;
begin
 select * into current_row from public.store_settings where store_id=sid for update;
 if not found or current_row.version<>p_version then raise sqlstate 'PT409' using message='As configurações mudaram. Reabra a página.';end if;
 if length(btrim(coalesce(p_store->>'name',''))) not between 1 and 100 or coalesce(p_store->>'primary_color','') !~ '^#[0-9A-Fa-f]{6}$'
 or coalesce(p_store->>'currency','') not in('EUR','BRL','USD','GBP')
 or not exists(select 1 from pg_timezone_names where name=p_store->>'timezone')
 then raise exception 'Confira nome, cor, moeda e fuso horário.';end if;
 if (select currency from public.stores where id=sid)<>p_store->>'currency' and exists(select 1 from public.orders where store_id=sid) then
  raise exception 'A moeda não pode ser alterada depois de registrar encomendas.';end if;
 logo:=coalesce(p_store->>'logo_url','/logo.png');
 if logo !~ '^/[a-zA-Z0-9_/-]+[.](png|jpg|webp)$' and logo !~ ('^'||sid||'/[a-f0-9-]{36}[.](webp|jpg)$') then raise exception 'Use o logótipo enviado para esta loja.';end if;
 if jsonb_typeof(p_settings)<>'object' or pg_column_size(p_settings)>65536 or
 coalesce(p_settings->>'whatsapp','') !~ '^[+0-9 ()-]{6,30}$' or length(coalesce(p_settings->>'email',''))>254 or length(coalesce(p_settings->>'address',''))>500
 or length(coalesce(p_settings->>'hours',''))>300 or coalesce(p_settings->>'lead_days','') !~ '^[0-9]{1,2}$'
 or coalesce(p_settings->>'daily_capacity','') !~ '^[0-9]{1,4}$'
 or coalesce(p_settings->>'deposit_percent','') !~ '^[0-9]{1,3}$' or (p_settings->>'deposit_percent')::integer>100
 or not(p_settings ? 'delivery_fee_cents') or (p_settings->'delivery_fee_cents'<>'null'::jsonb and coalesce(p_settings->>'delivery_fee_cents','') !~ '^[0-9]{1,6}$')
 or jsonb_typeof(p_settings->'delivery_enabled') is distinct from 'boolean' then raise exception 'Confira contatos, antecedência, capacidade, sinal e entrega.';end if;
 foreach arr in array array['cake_masses','cake_fillings'] loop
  if jsonb_typeof(p_settings->arr) is distinct from 'array' or jsonb_array_length(p_settings->arr)>50 then raise exception 'Use até 50 opções de massa/recheio.';end if;
  for value in select v from jsonb_array_elements(p_settings->arr) v loop
   if jsonb_typeof(value)='string' then
    if length(btrim(value#>>'{}')) not between 1 and 80 then raise exception 'Nome de opção inválido.';end if;
   elsif jsonb_typeof(value)='object' then
    if length(btrim(coalesce(value->>'label',''))) not between 1 and 80 or coalesce(value->>'extra_cents','') !~ '^[0-9]{1,6}$' then raise exception 'Confira nome e acréscimo da opção.';end if;
   else raise exception 'Opção inválida.';end if;
  end loop;
 end loop;
 if jsonb_typeof(p_settings->'gallery') is distinct from 'array' or jsonb_array_length(p_settings->'gallery')>100 then raise exception 'Galeria inválida.';end if;
 for value in select v from jsonb_array_elements(p_settings->'gallery') v loop
  if coalesce(value->>'image','') !~ ('^'||sid||'/[a-f0-9-]{36}[.](webp|jpg)$') or length(coalesce(value->>'title',''))>100 or not exists(select 1 from public.catalog_categories where store_id=sid and id=(value->>'category_id')::uuid) then raise exception 'Use imagens e categorias desta loja na galeria.';end if;
 end loop;
 update public.stores set name=btrim(p_store->>'name'),logo_url=logo,primary_color=p_store->>'primary_color',currency=p_store->>'currency',timezone=p_store->>'timezone' where id=sid;
 update public.store_settings set settings=p_settings,version=version+1,updated_at=now() where store_id=sid returning * into current_row;
 perform presente_doce_private.audit('store.settings',sid::text);return to_jsonb(current_row);
end $$;
create function public.operations_snapshot() returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.current_store_id();
begin
 if not presente_doce_private.is_store_member(sid) then raise exception 'Acesso não autorizado.' using errcode='42501';end if;
 perform presente_doce_private.expire_holds(sid);
 return jsonb_build_object(
 'store',(select to_jsonb(s) from public.stores s where id=sid),
 'settings',(select to_jsonb(s) from public.store_settings s where store_id=sid),
 'entitlement',(select jsonb_build_object('status',status,'expires_at',expires_at) from public.store_entitlements where store_id=sid),
 'customers',coalesce((select jsonb_agg(to_jsonb(c) order by name) from public.customers c where store_id=sid),'[]'),
 'orders',coalesce((select jsonb_agg(to_jsonb(o) order by delivery_date desc,created_at desc) from public.orders o where store_id=sid),'[]'),
 'items',coalesce((select jsonb_agg(to_jsonb(i)) from public.order_items i where store_id=sid),'[]'),
 'finance',coalesce((select jsonb_agg(to_jsonb(f) order by day desc) from public.finance_entries f where store_id=sid),'[]'),
 'stock',coalesce((select jsonb_agg(to_jsonb(s)) from public.product_stock s where store_id=sid),'[]'),
 'blocks',coalesce((select jsonb_agg(to_jsonb(b)) from public.calendar_blocks b where store_id=sid),'[]'),
 'ingredients',coalesce((select jsonb_agg(to_jsonb(i) order by name) from public.ingredients i where store_id=sid),'[]'));
end $$;
create function public.storefront_availability() returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.current_store_id();
begin
 if not exists(select 1 from public.stores where id=sid and visible) then return '{}';end if;
 return jsonb_build_object('stock',coalesce((select jsonb_agg(jsonb_build_object('product_id',s.product_id,'option_key',s.option_key,'available',s.available+
  coalesce((select sum(i.quantity) from public.order_items i join public.orders o on o.id=i.order_id
   where o.store_id=sid and o.status='pending' and o.reserved and o.hold_until<now() and i.product_id=s.product_id and i.option_key=s.option_key and i.mode='ready'),0)))
  from public.product_stock s join public.catalog_products p on p.id=s.product_id and p.store_id=s.store_id where s.store_id=sid and p.published),'[]'),
 'blocks',coalesce((select jsonb_agg(jsonb_build_object('day',day,'blocked',blocked)) from public.calendar_blocks where store_id=sid),'[]'));
end $$;
create function public.consume_checkout_limit(p_store uuid,p_client text) returns boolean language plpgsql security definer set search_path='' as $$
declare bucket text;hits integer;allowed boolean:=true;
begin
 if not exists(select 1 from public.stores where id=p_store and visible) then return false;end if;
 foreach bucket in array array['store:'||p_store,'client:'||p_store||':'||left(p_client,64)] loop
  insert into presente_doce_private.request_limits(scope,hits) values(bucket,1) on conflict(scope) do update
   set hits=case when request_limits.window_start<now()-interval '10 minutes' then 1 else request_limits.hits+1 end,
   window_start=case when request_limits.window_start<now()-interval '10 minutes' then now() else request_limits.window_start end returning request_limits.hits into hits;
  if hits>(case when bucket like 'store:%' then 300 else 20 end) then allowed:=false;end if;
 end loop;
 return allowed;
end $$;
-- New tenant creation is an authenticated, rate-bounded operation, not a public INSERT.
create function public.create_store(p_name text,p_slug text) returns uuid language plpgsql security definer set search_path='' as $$
declare uid uuid:=auth.uid();sid uuid:=gen_random_uuid();
begin
 if uid is null then raise exception 'Entre com uma conta verificada.' using errcode='42501';end if;
 perform pg_advisory_xact_lock(hashtextextended(uid::text,3));
 if (select count(*) from public.store_members where user_id=uid and role='owner')>=3 then raise exception 'Limite de lojas desta conta atingido.';end if;
 if length(btrim(p_name)) not between 1 and 100 or p_slug !~ '^[a-z0-9][a-z0-9-]{2,49}$' then raise exception 'Nome ou endereço de loja inválido.';end if;
 insert into public.stores(id,slug,name) values(sid,p_slug,btrim(p_name));
 insert into public.store_members(store_id,user_id,role) values(sid,uid,'owner');
 insert into public.store_entitlements(store_id,status,expires_at) values(sid,'trial',now()+interval '14 days');
 insert into public.store_settings(store_id) values(sid);
 insert into public.catalog_categories(store_id,name) values(sid,'Produtos');
 insert into public.store_presentation(store_id,home_title,home_description,admin_name,about_text)
 values(sid,'Seja bem-vindo!','Feito com carinho, por encomenda.',p_name,p_name);
 return sid;
exception when unique_violation then raise exception 'Este endereço de loja já está em uso.';
end $$;
revoke all on function public.change_order_status(uuid,integer,text),public.record_finance(jsonb),public.save_store_settings(integer,jsonb,jsonb),public.operations_snapshot(),public.create_store(text,text) from public,anon;
grant execute on function public.change_order_status(uuid,integer,text),public.record_finance(jsonb),public.save_store_settings(integer,jsonb,jsonb),public.operations_snapshot(),public.create_store(text,text) to authenticated;
revoke all on function public.storefront_availability() from public;grant execute on function public.storefront_availability() to anon,authenticated;
revoke all on function public.consume_checkout_limit(uuid,text) from public,anon,authenticated;grant execute on function public.consume_checkout_limit(uuid,text) to service_role;


create function presente_doce_private.is_store_manager(p_store uuid) returns boolean language sql stable security definer set search_path='' as $$
 select exists(select 1 from public.store_members where store_id=p_store and user_id=(select auth.uid()) and active and role in('owner','manager'));
$$;
revoke all on function presente_doce_private.is_store_manager(uuid) from public;grant execute on function presente_doce_private.is_store_manager(uuid) to anon,authenticated,service_role;
create or replace function presente_doce_private.is_catalog_admin() returns boolean language sql stable security definer set search_path='' as $$
 select presente_doce_private.is_store_manager(presente_doce_private.current_store_id());
$$;
do $read$ declare tab text;def text;f record;begin
 foreach tab in array array['catalog_products','catalog_categories','pricing_recipes','store_presentation','store_settings','customers','orders','order_items','product_stock','stock_movements','calendar_blocks','finance_entries','ingredients','audit_events'] loop
 execute format('alter policy member_read on public.%I using(store_id=presente_doce_private.current_store_id() and presente_doce_private.is_store_manager(store_id))',tab);end loop;
 for f in select p.oid from pg_proc p join pg_namespace n on p.pronamespace=n.oid where n.nspname='presente_doce_private' and p.proname in('save_catalog_category','delete_catalog_category') loop
  select pg_get_functiondef(f.oid) into def;
  def:=replace(def,'lock table public.catalog_categories, public.catalog_products in share row exclusive mode;',
   'perform pg_advisory_xact_lock(hashtextextended(presente_doce_private.current_store_id()::text,4));');
  execute def;
 end loop;
 select pg_get_functiondef('public.operations_snapshot()'::regprocedure) into def;
 def:=replace(def,'not presente_doce_private.is_store_member(sid)','not presente_doce_private.is_store_manager(sid)');execute def;
end $read$;
alter policy own_entitlement on public.store_entitlements using(presente_doce_private.is_store_manager(store_id));
alter table public.stock_movements add column idempotency_key uuid;
alter table public.stock_movements add unique(store_id,idempotency_key);
drop function public.adjust_stock(text,text,integer,text);
create function public.adjust_stock(p_product text,p_option text,p_delta integer,p_reason text,p_key uuid) returns integer language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();amount integer;product public.catalog_products;existing public.stock_movements;
begin
 if p_key is null or p_delta is null or p_delta=0 or abs(p_delta)>100000 or length(btrim(p_reason)) not between 1 and 200 then raise exception 'Indique uma quantidade e motivo válidos.';end if;
 perform pg_advisory_xact_lock(hashtextextended(sid::text||p_key::text,5));
 select * into existing from public.stock_movements where store_id=sid and idempotency_key=p_key;
 if found then
  if existing.product_id<>p_product or existing.option_key<>p_option or existing.delta<>p_delta then raise exception 'Tentativa já utilizada com outros dados.';end if;
  select available into amount from public.product_stock where store_id=sid and product_id=p_product and option_key=p_option;return amount;
 end if;
 select * into product from public.catalog_products where store_id=sid and id=p_product;
 if not found then raise exception 'Produto não encontrado.';end if;
 if jsonb_array_length(coalesce(product.details->'variants','[]'))>0 and not exists(select 1 from jsonb_array_elements(product.details->'variants') v where v->>'label'=p_option) then raise exception 'Opção inválida.';end if;
 if jsonb_array_length(coalesce(product.details->'variants','[]'))=0 and p_option<>'' then raise exception 'Opção inválida.';end if;
 insert into public.product_stock(store_id,product_id,option_key,available) values(sid,p_product,p_option,0) on conflict do nothing;
 update public.product_stock set available=available+p_delta where store_id=sid and product_id=p_product and option_key=p_option and available+p_delta>=0 returning available into amount;
 if not found then raise exception 'O estoque não pode ficar negativo.';end if;
 insert into public.stock_movements(store_id,product_id,option_key,delta,reason,actor,idempotency_key) values(sid,p_product,p_option,p_delta,p_reason,auth.uid(),p_key);
 perform presente_doce_private.audit('stock.adjust',p_product,jsonb_build_object('delta',p_delta,'option',p_option));return amount;
end $$;
revoke all on function public.adjust_stock(text,text,integer,text,uuid) from public,anon;grant execute on function public.adjust_stock(text,text,integer,text,uuid) to authenticated;


alter table public.customers add column archived boolean not null default false;
grant update(archived) on public.customers to authenticated;
create function public.merge_customers(p_source uuid,p_target uuid) returns void language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();
begin
 if p_source=p_target then raise exception 'Selecione dois clientes diferentes.';end if;
 perform id from public.customers where store_id=sid and id in(p_source,p_target) order by id for update;
 if (select count(*) from public.customers where store_id=sid and id in(p_source,p_target))<>2 then raise exception 'Clientes não encontrados nesta loja.';end if;
 update public.orders set customer_id=p_target,version=version+1,updated_at=now() where store_id=sid and customer_id=p_source;
 update public.customers set archived=true where store_id=sid and id=p_source;
 perform presente_doce_private.audit('customer.merge',p_source::text,jsonb_build_object('target',p_target));
end $$;
create function public.set_delivery_fee(p_id uuid,p_version integer,p_cents integer) returns jsonb language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.require_store_write();o public.orders;paid bigint;total bigint;
begin
 select * into o from public.orders where store_id=sid and id=p_id for update;
 if not found or o.version<>p_version then raise sqlstate 'PT409' using message='A encomenda mudou. Atualize a lista.';end if;
 if p_cents is null or p_cents not between 0 and 999999 or o.fulfillment<>'delivery' or o.status in('completed','canceled') then raise exception 'Taxa de entrega inválida para esta encomenda.';end if;
 total:=o.total_cents-o.delivery_cents+p_cents;
 select coalesce(sum(case when type='receipt' then amount_cents when type='refund' then -amount_cents else 0 end),0) into paid from public.finance_entries where store_id=sid and order_id=o.id;
 if paid>total then raise exception 'Registre o estorno do excedente antes de reduzir o total.';end if;
 update public.orders set total_cents=total,delivery_cents=p_cents,delivery_pending=false,deposit_cents=round(total*deposit_percent::numeric/100),version=version+1,updated_at=now() where id=o.id returning * into o;
 perform presente_doce_private.audit('order.delivery_fee',o.id::text,jsonb_build_object('cents',p_cents));return to_jsonb(o);
end $$;
revoke all on function public.merge_customers(uuid,uuid),public.set_delivery_fee(uuid,integer,integer) from public,anon;
grant execute on function public.merge_customers(uuid,uuid),public.set_delivery_fee(uuid,integer,integer) to authenticated;
alter table public.ingredients add check(pack_price_cents<=999999999 and pack_quantity<=999999999 and scale(pack_quantity)<=6 and stock_quantity<=999999999 and scale(stock_quantity)<=6);

create function presente_doce_private.recipe_cost(p_store uuid,p_recipe uuid,p_path uuid[] default '{}') returns numeric language plpgsql stable security definer set search_path='' as $$
declare r public.pricing_recipes;i jsonb;ing public.ingredients;child public.pricing_recipes;total numeric:=0;pack numeric;amount numeric;used numeric;
begin
 if p_recipe=any(p_path) or cardinality(p_path)>=20 then raise exception 'A ficha contém um ciclo ou mais de 20 níveis.';end if;
 select * into r from public.pricing_recipes where store_id=p_store and id=p_recipe;if not found then raise exception 'Sub-receita não encontrada nesta loja.';end if;
 for i in select value from jsonb_array_elements(r.recipe->'ingredients') loop
  used:=replace(i->>'usedQuantity',',','.')::numeric;
  if nullif(i->>'ingredientId','') is not null then
   select * into ing from public.ingredients where store_id=p_store and id=(i->>'ingredientId')::uuid;
   if not found then raise exception 'Ingrediente não encontrado nesta loja.';end if;pack:=ing.pack_quantity;amount:=ing.pack_price_cents::numeric/100;
  elsif nullif(i->>'recipeId','') is not null then
   select * into child from public.pricing_recipes where store_id=p_store and id=(i->>'recipeId')::uuid;
   if not found then raise exception 'Sub-receita não encontrada nesta loja.';end if;
   pack:=replace(child.recipe->>'yieldCount',',','.')::numeric;amount:=round(presente_doce_private.recipe_cost(p_store,child.id,p_path||p_recipe),6);
  else pack:=replace(i->>'packQuantity',',','.')::numeric;amount:=replace(i->>'packPrice',',','.')::numeric;end if;
  total:=total+amount/pack*used;
 end loop;
 return total;
end $$;
create function presente_doce_private.resolve_recipe() returns trigger language plpgsql security definer set search_path='' as $$
declare i jsonb;items jsonb:='[]';ing public.ingredients;child public.pricing_recipes;
begin
 perform pg_advisory_xact_lock(hashtextextended(new.store_id::text,6));
 for i in select value from jsonb_array_elements(new.recipe->'ingredients') loop
  if nullif(i->>'ingredientId','') is not null and nullif(i->>'recipeId','') is not null then raise exception 'Use ingrediente ou sub-receita, não ambos na mesma linha.';end if;
  if nullif(i->>'ingredientId','') is not null then
   select * into ing from public.ingredients where store_id=new.store_id and id=(i->>'ingredientId')::uuid;
   if not found then raise exception 'Ingrediente não encontrado nesta loja.';end if;
   i:=i||jsonb_build_object('name',ing.name,'unit',ing.unit,'packQuantity',ing.pack_quantity::text,'packPrice',(ing.pack_price_cents::numeric/100)::text);
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
create trigger resolve_recipe before insert or update of recipe on public.pricing_recipes for each row execute function presente_doce_private.resolve_recipe();
create function presente_doce_private.refresh_recipe_links() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if tg_table_name='ingredients' then
  if old.unit<>new.unit and exists(select 1 from public.pricing_recipes r cross join lateral jsonb_array_elements(r.recipe->'ingredients') i where r.store_id=new.store_id and i->>'ingredientId'=new.id::text) then raise exception 'A unidade está em uso em fichas. Crie outro ingrediente ou desvincule antes de mudar.';end if;
  if row(old.name,old.unit,old.pack_quantity,old.pack_price_cents) is distinct from row(new.name,new.unit,new.pack_quantity,new.pack_price_cents) then
   update public.pricing_recipes r set recipe=recipe where r.store_id=new.store_id and exists(select 1 from jsonb_array_elements(r.recipe->'ingredients') i where i->>'ingredientId'=new.id::text);
  end if;
 elsif old.recipe is distinct from new.recipe then
  update public.pricing_recipes r set recipe=recipe where r.store_id=new.store_id and r.id<>new.id and exists(select 1 from jsonb_array_elements(r.recipe->'ingredients') i where i->>'recipeId'=new.id::text);
 end if;return new;
end $$;
create trigger refresh_ingredient_links after update on public.ingredients for each row execute function presente_doce_private.refresh_recipe_links();
create trigger refresh_subrecipe_links after update of recipe on public.pricing_recipes for each row execute function presente_doce_private.refresh_recipe_links();
create function presente_doce_private.guard_recipe_delete() returns trigger language plpgsql security definer set search_path='' as $$
begin
 if exists(select 1 from public.pricing_recipes r cross join lateral jsonb_array_elements(r.recipe->'ingredients') i where r.store_id=old.store_id and i->>'recipeId'=old.id::text) then raise exception 'Esta ficha é usada por outra. Desvincule-a primeiro.';end if;return old;
end $$;
create trigger guard_recipe_delete before delete on public.pricing_recipes for each row execute function presente_doce_private.guard_recipe_delete();
revoke all on function presente_doce_private.recipe_cost(uuid,uuid,uuid[]),presente_doce_private.resolve_recipe(),presente_doce_private.refresh_recipe_links(),presente_doce_private.guard_recipe_delete() from public,anon,authenticated;
grant all on public.store_settings,public.customers,public.orders,public.order_items,public.product_stock,public.stock_movements,public.calendar_blocks,public.finance_entries,public.ingredients,public.audit_events to service_role;
grant usage,select on all sequences in schema public to service_role;

commit;
