-- Keep the existing restrictive policies and RLS. Use the existing authorized
-- module lookup instead of selecting the now-private app_users table directly.
begin;
alter policy security_active_company_user on public.estimates using (public.company_security_table_access('estimates',false)) with check (public.company_security_table_access('estimates',true));
alter policy security_active_company_user on public.estimate_quantity_options using (public.company_security_table_access('estimate_quantity_options',false)) with check (public.company_security_table_access('estimate_quantity_options',true));
alter policy security_active_company_user on public.outsource_suppliers using (public.company_security_table_access('outsource_suppliers',false)) with check (public.company_security_table_access('outsource_suppliers',true));
alter policy security_active_company_user on public.estimate_outsource_quotes using (public.company_security_table_access('estimate_outsource_quotes',false)) with check (public.company_security_table_access('estimate_outsource_quotes',true));
grant select,insert,update,delete on public.estimate_quantity_options,public.estimate_outsource_quotes to authenticated;
commit;
