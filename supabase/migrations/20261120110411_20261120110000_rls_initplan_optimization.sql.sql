/*
# Optimize RLS policies (fix auth_rls_initplan warnings)

1. What this does
- Rewrites two existing row level security policies so the JWT email is read
  ONCE per query instead of once per row. Same access rules, faster queries.
2. Tables and policies touched (no schema change, no data change)
- `gpo_admins`: policy "select_own_admin_row" — an authenticated user can read
  only their own admin row (matched by e-mail in the security token).
- `gpo_responses`: policy "select_admin_responses" — an authenticated user can
  read responses only if their e-mail is in the admins list.
3. Security
- No change in who can access what. Both policies keep the exact same
  conditions; only the evaluation strategy improves:
  `auth.jwt()` becomes `(select auth.jwt())` so Postgres evaluates it once.
4. Notes
- Idempotent: policies are dropped first and recreated. Safe to re-run.
*/

DROP POLICY IF EXISTS "select_own_admin_row" ON public.gpo_admins;
CREATE POLICY "select_own_admin_row"
ON public.gpo_admins FOR SELECT
TO authenticated
USING (email = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''::text)));

DROP POLICY IF EXISTS "select_admin_responses" ON public.gpo_responses;
CREATE POLICY "select_admin_responses"
ON public.gpo_responses FOR SELECT
TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.gpo_admins a
  WHERE a.email = lower(COALESCE((SELECT auth.jwt() ->> 'email'), ''::text))
));