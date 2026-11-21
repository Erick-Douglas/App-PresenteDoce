begin;
create function presente_doce_private.readable_brand(p_color text) returns boolean language plpgsql immutable set search_path='' as $fn$
declare rgb bytea;channel numeric;luminance numeric:=0;weight numeric;i integer;
begin
 if p_color !~ '^#[0-9a-fA-F]{6}$' then return false;end if;
 rgb:=decode(substr(p_color,2),'hex');
 for i in 0..2 loop channel:=get_byte(rgb,i)::numeric/255;channel:=case when channel<=0.04045 then channel/12.92 else power((channel+0.055)/1.055,2.4) end;
 weight:=case i when 0 then 0.2126 when 1 then 0.7152 else 0.0722 end;luminance:=luminance+channel*weight;end loop;
 return 1.05/(luminance+0.05)>=4.5;
end $fn$;
revoke all on function presente_doce_private.readable_brand(text) from public,anon,authenticated;
alter table public.stores add constraint readable_brand check(presente_doce_private.readable_brand(primary_color));
do $patch$
declare def text;
begin
 select pg_get_functiondef('public.save_store_settings(integer,jsonb,jsonb)'::regprocedure) into def;
 def:=replace(def,'if logo !~','if logo<>''/store-placeholder.svg'' and logo !~');
 def:=replace(def,'update public.stores set name=', 'if not presente_doce_private.readable_brand(p_store->>''primary_color'') then raise exception ''Escolha uma cor com contraste suficiente para texto branco.'';end if; update public.stores set name=');
 execute def;
 select pg_get_functiondef('public.create_store(text,text)'::regprocedure) into def;
 def:=replace(def,'if uid is null then','if uid is null or not exists(select 1 from auth.users where id=uid and email_confirmed_at is not null) then');
 execute def;
end $patch$;
commit;
