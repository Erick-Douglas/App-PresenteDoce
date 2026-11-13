begin;

create table public.store_presentation (
  id boolean primary key default true check (id),
  home_title text not null check (char_length(btrim(home_title)) between 1 and 80),
  home_description text not null check (char_length(btrim(home_description)) between 1 and 180),
  admin_name text not null check (char_length(btrim(admin_name)) between 1 and 60),
  about_text text not null check (char_length(btrim(about_text)) between 1 and 1200),
  revision integer not null default 1 check (revision > 0)
);

insert into public.store_presentation (home_title, home_description, admin_name, about_text) values (
  'Seja bem-vindo!', 'Bolos, doces e salgados feitos por encomenda.', 'Gabriela',
  'Somos uma confeitaria artesanal por encomenda. Preparamos bolos, doces e salgados para celebrar.'
);

alter table public.store_presentation enable row level security;
revoke all on public.store_presentation from public, anon, authenticated;
grant select on public.store_presentation to anon, authenticated;
grant update (home_title, home_description, admin_name, about_text) on public.store_presentation to authenticated;

create policy "store presentation is readable" on public.store_presentation
for select to anon, authenticated using (true);

create policy "catalog admin updates store presentation" on public.store_presentation
for update to authenticated
using ((select presente_doce_private.is_catalog_admin()))
with check ((select presente_doce_private.is_catalog_admin()));

create function presente_doce_private.bump_store_presentation_revision()
returns trigger language plpgsql set search_path = '' as $$
begin
  new.revision := old.revision + 1;
  return new;
end;
$$;
revoke all on function presente_doce_private.bump_store_presentation_revision() from public, anon, authenticated;
create trigger bump_store_presentation_revision before update on public.store_presentation
for each row execute function presente_doce_private.bump_store_presentation_revision();

commit;
