-- The legacy restrictive policy queried app_users directly after its SELECT grant was revoked.
-- Reuse the existing materials permission function; keep module read/write policies and RLS enabled.
alter policy security_active_company_user on public.materials using (public.has_module_access('materials', false)) with check (public.has_module_access('materials', false));
alter policy security_active_company_user on public.material_prices using (public.has_module_access('materials', false)) with check (public.has_module_access('materials', false));
alter policy security_active_company_user on public.inventory_movements using (public.has_module_access('materials', false)) with check (public.has_module_access('materials', false));
