create schema if not exists security_private;
revoke all on schema security_private from public,anon,authenticated;
create table if not exists public.company_security_state(user_id uuid primary key references auth.users(id) on delete cascade,password_changed_at timestamptz,reminder_days integer not null default 90 check(reminder_days between 30 and 365));
create table if not exists public.company_security_events(id bigint generated always as identity primary key,occurred_at timestamptz not null default now(),actor_id uuid,actor_email text,action text not null,resource text,record_id text,source text not null);
alter table public.company_security_state enable row level security;
alter table public.company_security_events enable row level security;
revoke all on public.company_security_state,public.company_security_events from anon,authenticated;
grant select on public.company_security_state,public.company_security_events to authenticated;
create policy security_state_self on public.company_security_state for select to authenticated using(user_id=auth.uid());
create policy security_events_owner on public.company_security_events for select to authenticated using(public.is_owner());
create or replace function security_private.audit_business_write() returns trigger language plpgsql security definer set search_path=pg_catalog as $$
declare actor uuid:=auth.uid(); mail text; rid text; begin
select email into mail from auth.users where id=actor;
if TG_OP='DELETE' then rid:=coalesce(to_jsonb(old)->>'id',to_jsonb(old)->>'user_id'); else rid:=coalesce(to_jsonb(new)->>'id',to_jsonb(new)->>'user_id'); end if;
insert into public.company_security_events(actor_id,actor_email,action,resource,record_id,source) values(actor,mail,TG_OP,TG_TABLE_NAME,rid,case when actor is null then 'server' else 'database' end);
if TG_OP='DELETE' then return old; else return new; end if; end $$;
revoke all on function security_private.audit_business_write() from public,anon,authenticated;
do $$ declare r record; begin for r in select tablename from pg_tables where schemaname='public' and tablename not in ('owner_password_setup_tokens','company_security_state','company_security_events') loop
execute format('drop trigger if exists company_audit_write on public.%I',r.tablename);
execute format('create trigger company_audit_write after insert or update or delete on public.%I for each row execute function security_private.audit_business_write()',r.tablename);
end loop; end $$;
create or replace function public.company_security_complete_password(p_user_id uuid) returns void language plpgsql security definer set search_path=pg_catalog as $$ begin
insert into public.company_security_state(user_id,password_changed_at) values(p_user_id,now()) on conflict(user_id) do update set password_changed_at=excluded.password_changed_at;
delete from auth.sessions where user_id=p_user_id;
insert into public.company_security_events(actor_id,actor_email,action,resource,source) select id,email,'PASSWORD_SET','account','server' from auth.users where id=p_user_id;
end $$;
revoke all on function public.company_security_complete_password(uuid) from public,anon,authenticated;
grant execute on function public.company_security_complete_password(uuid) to service_role;
create or replace function public.company_security_log_access(p_resource text) returns void language plpgsql security definer set search_path=pg_catalog as $$ begin
if auth.uid() is null or not (public.is_owner() or exists(select 1 from public.app_users where user_id=auth.uid() and active)) then raise exception 'Forbidden'; end if;
insert into public.company_security_events(actor_id,actor_email,action,resource,source) select id,email,'OPEN',left(p_resource,240),'browser' from auth.users where id=auth.uid();
end $$;
revoke all on function public.company_security_log_access(text) from public,anon;
grant execute on function public.company_security_log_access(text) to authenticated;
revoke all on public.owner_password_setup_tokens from public,anon,authenticated;

grant select,update on public.owner_password_setup_tokens to service_role;
grant select on public.app_users to service_role;
