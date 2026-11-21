begin;

do $patch$
declare def text;sig text;
begin
 foreach sig in array array['public.change_order_status(uuid,integer,text)','public.set_delivery_fee(uuid,integer,integer)','public.save_store_settings(integer,jsonb,jsonb)'] loop
 select pg_get_functiondef(sig::regprocedure) into def;
 def:=replace(def,'not found or o.version<>p_version','not found or p_version is null or o.version<>p_version');
 def:=replace(def,'not found or current_row.version<>p_version','not found or p_version is null or current_row.version<>p_version');
 execute def;
 end loop;
 select pg_get_functiondef('presente_doce_private.create_order(uuid,jsonb,boolean,text)'::regprocedure) into def;
 def:=replace(def,'return jsonb_build_object(''id'',v_order_id','select * into o from public.orders where id=v_order_id; return jsonb_build_object(''version'',o.version,''id'',v_order_id');
 execute def;
end $patch$;


do $patch$
declare def text;
begin
 select pg_get_functiondef('public.record_finance(jsonb)'::regprocedure) into def;
 def:=replace(def,$old$o.status in('draft','expired','canceled')$old$,$new$o.status in('draft','pending','expired','canceled')$new$);
 execute def;
end $patch$;

commit;
