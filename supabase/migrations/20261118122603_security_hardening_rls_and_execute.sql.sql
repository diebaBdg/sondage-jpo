-- Security hardening: close direct RPC access, formalize RLS access model.
-- No tables, functions, columns or rows are dropped. All app flows go through
-- server routes using the service role, which is unaffected by these changes.

-- 1. Functions: revoke public executability (audit findings 0028/0029).
do $$
declare
  fn record;
begin
  for fn in
    select p.oid, p.proname
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', fn.oid::regprocedure);
  end loop;
end;
$$;

grant execute on all functions in schema public to service_role;

-- 2. gpo_admins: connected users may read only their own admin row.
grant select on public.gpo_admins to authenticated;

create policy "select_own_admin_row" on public.gpo_admins
  for select to authenticated
  using (email = lower(coalesce((select auth.jwt() ->> 'email'), '')));

-- 3. gpo_responses: reads restricted to signed-in admins; no direct
--    anonymous or client-side writes (insert/update/delete stay server-only).
grant select on public.gpo_responses to authenticated;

create policy "select_admin_responses" on public.gpo_responses
  for select to authenticated
  using (
    exists (
      select 1 from public.gpo_admins a
      where a.email = lower(coalesce((select auth.jwt() ->> 'email'), ''))
    )
  );
