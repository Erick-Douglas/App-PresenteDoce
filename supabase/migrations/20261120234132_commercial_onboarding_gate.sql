begin;
create table presente_doce_private.platform_config(singleton boolean primary key default true check(singleton),onboarding_enabled boolean not null default false);
insert into presente_doce_private.platform_config(singleton) values(true);
alter table presente_doce_private.platform_config enable row level security;
revoke all on presente_doce_private.platform_config from public,anon,authenticated;
do $patch$
declare def text;
begin
 select pg_get_functiondef('public.create_store(text,text)'::regprocedure) into def;
 def:=replace(def,'perform pg_advisory_xact_lock(hashtextextended(uid::text,3));','if not exists(select 1 from presente_doce_private.platform_config where singleton and onboarding_enabled) then raise exception ''O cadastro de novas lojas ainda não foi disponibilizado.'';end if; perform pg_advisory_xact_lock(hashtextextended(uid::text,3));');
 execute def;
end $patch$;
commit;
