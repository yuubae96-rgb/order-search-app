do $block$ declare r record; begin
 for r in select schemaname,tablename,policyname from pg_policies where schemaname in ('public','storage') and ('anon'=any(roles) or 'public'=any(roles)) loop
 execute format('drop policy %I on %I.%I',r.policyname,r.schemaname,r.tablename); end loop;
 for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') loop
 execute format('alter table public.%I enable row level security',r.relname);
 execute format('revoke all on table public.%I from anon',r.relname);
 end loop; end $block$;
revoke all on all sequences in schema public from anon;
revoke execute on all functions in schema public from anon;
revoke all on storage.objects from anon;
create or replace function public.save_drawing_rule_state(p_rules jsonb,p_pairs jsonb) returns jsonb language plpgsql security definer set search_path=public as $f$
begin
 if not public.is_owner() then raise exception 'Forbidden' using errcode='42501'; end if;
 insert into public.drawing_rule_learning(workspace,rules,pairs,updated_at) values('murakami-nameplate',coalesce(p_rules,'[]'::jsonb),coalesce(p_pairs,'[]'::jsonb),now()) on conflict(workspace) do update set rules=excluded.rules,pairs=excluded.pairs,updated_at=now();
 return jsonb_build_object('ok',true,'updated_at',now()); end $f$;
create or replace function public.get_drawing_rule_state() returns jsonb language sql security definer set search_path=public as $f$
 select jsonb_build_object('rules',coalesce(rules,'[]'::jsonb),'pairs',coalesce(pairs,'[]'::jsonb),'updated_at',updated_at) from public.drawing_rule_learning where workspace='murakami-nameplate' and public.is_owner() $f$;
create or replace function public.delete_materials_bulk(p_ids bigint[]) returns integer language plpgsql security definer set search_path=public as $f$
declare v_count integer; begin if not public.has_module_access('materials',true) then raise exception 'Forbidden' using errcode='42501'; end if;
 if p_ids is null or cardinality(p_ids)=0 then return 0; end if;
 delete from inventory_movements where material_id=any(p_ids); delete from materials where id=any(p_ids); get diagnostics v_count=row_count; return v_count; end $f$;
revoke execute on function public.save_drawing_rule_state(jsonb,jsonb),public.get_drawing_rule_state(),public.delete_materials_bulk(bigint[]) from public,anon;
grant execute on function public.save_drawing_rule_state(jsonb,jsonb),public.get_drawing_rule_state(),public.delete_materials_bulk(bigint[]) to authenticated;
do $block$ declare r record; begin for r in select c.relname from pg_class c join pg_namespace n on n.oid=c.relnamespace where n.nspname='public' and c.relkind in ('r','p') and c.relname not in ('app_users','app_permissions') loop
 execute format('create policy security_active_company_user on public.%I as restrictive for all to authenticated using (public.is_owner() or exists(select 1 from public.app_users where user_id=auth.uid() and active=true)) with check (public.is_owner() or exists(select 1 from public.app_users where user_id=auth.uid() and active=true))',r.relname); end loop; end $block$;