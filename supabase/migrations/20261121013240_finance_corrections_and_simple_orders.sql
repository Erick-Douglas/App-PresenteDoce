begin;
alter table public.finance_entries
 add column version integer not null default 1 check(version>0),
 add column voided_at timestamptz,
 add column voided_by uuid,
 add column void_key uuid,
 add column replaced_by uuid references public.finance_entries(id),
 add constraint finance_correction_key unique(store_id,void_key);
create index finance_active_order on public.finance_entries(store_id,order_id) where voided_at is null;

-- Reuse the existing order lock and exclude superseded bookkeeping from every balance.
do $patch$ declare definition text;
begin
 select pg_get_functiondef('public.record_finance(jsonb)'::regprocedure) into definition;
 definition:=replace(definition,'where store_id=sid and order_id=oid;','where store_id=sid and order_id=oid and voided_at is null;');
 execute definition;
 select pg_get_functiondef('public.set_delivery_fee(uuid,integer,integer)'::regprocedure) into definition;
 definition:=replace(definition,'where store_id=sid and order_id=o.id;','where store_id=sid and order_id=o.id and voided_at is null;');
 execute definition;
 select pg_get_functiondef('public.change_order_status(uuid,integer,text)'::regprocedure) into definition;
 definition:=replace(definition,$old$elsif p_status='completed' and o.status<>'ready' then raise exception 'Marque a encomenda como pronta antes de concluir.';$old$,
 $new$elsif p_status='completed' and o.status not in('confirmed','production','ready') then raise exception 'Confirme a encomenda antes de concluir.';$new$);
 execute definition;
end $patch$;

-- A correction never deletes a money trail or records an actual refund.
-- Managers may correct the value/date/description of the same entry and order.
create function public.correct_finance(p_id uuid,p_version integer,p_key uuid,p_replacement jsonb default null)
returns jsonb language plpgsql security definer set search_path='' as $fn$
declare sid uuid:=presente_doce_private.require_store_write();entry public.finance_entries;replacement public.finance_entries;
 oid uuid;total bigint;net bigint;
begin
 if p_key is null then raise exception 'Identificação da correção em falta.';end if;
 perform pg_advisory_xact_lock(hashtextextended(sid::text||p_key::text,3));
 select order_id into oid from public.finance_entries where id=p_id and store_id=sid;
 -- Same lock order as record_finance; concurrent corrections/receipts serialize per order.
 if oid is not null then select total_cents into total from public.orders where id=oid and store_id=sid for update;end if;
 select * into entry from public.finance_entries where id=p_id and store_id=sid for update;
 if not found then raise exception 'Movimento não encontrado nesta loja.';end if;
 if entry.voided_at is not null then
  if entry.void_key=p_key then
   select * into replacement from public.finance_entries where id=entry.replaced_by and store_id=sid;
   return jsonb_build_object('entry',to_jsonb(entry),'replacement',case when replacement.id is null then null else to_jsonb(replacement) end);
  end if;
  raise sqlstate 'PT409' using message='O movimento já foi corrigido ou excluído. Atualize a lista.';
 end if;
 if p_version is null or entry.version<>p_version then raise sqlstate 'PT409' using message='O movimento mudou. Atualize a lista.';end if;
 update public.finance_entries set voided_at=now(),voided_by=auth.uid(),void_key=p_key,version=version+1 where id=entry.id returning * into entry;
 if p_replacement is not null and p_replacement<>'null'::jsonb then
  if jsonb_typeof(p_replacement)<>'object'
   or coalesce(p_replacement->>'amount_cents','') !~ '^[0-9]{1,9}$'
   or length(btrim(coalesce(p_replacement->>'description',''))) not between 1 and 200
   or length(coalesce(p_replacement->>'method',''))>40 then raise exception 'Confira valor, descrição e forma do movimento.';end if;
  insert into public.finance_entries(store_id,order_id,type,amount_cents,description,method,day,idempotency_key,actor)
   values(sid,entry.order_id,entry.type,(p_replacement->>'amount_cents')::bigint,btrim(p_replacement->>'description'),
    coalesce(nullif(p_replacement->>'method',''),'manual'),coalesce(nullif(p_replacement->>'day','')::date,current_date),p_key,auth.uid())
   returning * into replacement;
  update public.finance_entries set replaced_by=replacement.id where id=entry.id returning * into entry;
 end if;
 if oid is not null then
  select coalesce(sum(case when type='receipt' then amount_cents when type='refund' then -amount_cents else 0 end),0) into net
   from public.finance_entries where store_id=sid and order_id=oid and voided_at is null;
  if net<0 or net>total then raise exception 'Esta correção deixaria o saldo inconsistente. Confira primeiro os recebimentos e estornos vinculados.';end if;
 end if;
 perform presente_doce_private.audit(case when replacement.id is null then 'finance.void' else 'finance.correct' end,entry.id::text,
  jsonb_build_object('replacement',replacement.id,'order',oid));
 return jsonb_build_object('entry',to_jsonb(entry),'replacement',case when replacement.id is null then null else to_jsonb(replacement) end);
end $fn$;
revoke all on function public.correct_finance(uuid,integer,uuid,jsonb) from public,anon;
grant execute on function public.correct_finance(uuid,integer,uuid,jsonb) to authenticated;
commit;
