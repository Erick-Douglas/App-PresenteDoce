begin;
-- Anonymous projection: public stock and aggregate production slots, never customer/order details.
create or replace function public.storefront_availability() returns jsonb
language plpgsql security definer set search_path='' as $$
declare sid uuid:=presente_doce_private.current_store_id();
begin
 if not exists(select 1 from public.stores where id=sid and visible) then return '{}';end if;
 return jsonb_build_object(
  'stock',coalesce((select jsonb_agg(jsonb_build_object('product_id',s.product_id,'option_key',s.option_key,'available',s.available+
   coalesce((select sum(i.quantity) from public.order_items i join public.orders o on o.id=i.order_id
    where o.store_id=sid and o.status='pending' and o.reserved and o.hold_until<now() and i.product_id=s.product_id and i.option_key=s.option_key and i.mode='ready'),0)))
   from public.product_stock s join public.catalog_products p on p.id=s.product_id and p.store_id=s.store_id where s.store_id=sid and p.published),'[]'),
  'days',coalesce((select jsonb_agg(jsonb_build_object('day',d.day,'available_capacity',case
    when coalesce(b.capacity,(cfg.settings->>'daily_capacity')::integer,0)<=0 then null
    else greatest(0,coalesce(b.capacity,(cfg.settings->>'daily_capacity')::integer)-coalesce(used.units,0)) end) order by d.day)
   from public.stores store join public.store_settings cfg on cfg.store_id=store.id
   cross join lateral generate_series(0,120) as offset_days(n)
   cross join lateral (select (now() at time zone store.timezone)::date+offset_days.n as day) d
   left join public.calendar_blocks b on b.store_id=sid and b.day=d.day
   left join lateral (select sum(o.capacity_units)::integer units from public.orders o
    where o.store_id=sid and o.delivery_date=d.day and o.reserved and o.status not in('canceled','expired')
    and (o.status<>'pending' or o.hold_until>=now())) used on true
   where store.id=sid),'[]'),
  'blocks',coalesce((select jsonb_agg(jsonb_build_object('day',day,'blocked',blocked)) from public.calendar_blocks where store_id=sid),'[]'));
end $$;
comment on function public.storefront_availability() is 'Public stock, blocked dates and aggregate free production capacity for 120 days, scoped to the current visible store. No order or customer data.';
commit;