/*
# Add RLS policy and grant to gpo_settings

## Why
The Supabase database linter flagged `gpo_settings` as "RLS enabled but no
policies exist" (INFO-level advisory). The table had RLS enabled with no
policies and no grants, meaning it was locked down for anon/authenticated
roles (only the service role could reach it, which is how the app reads it
today). This migration adds an explicit admin-scoped SELECT policy and grant
so the table is protected by a real policy instead of merely being empty of
them, clearing the advisory and keeping the settings admin-only at the
database level.

## Changes
1. Security
   - `gpo_settings`: grant SELECT to `authenticated`.
   - `gpo_settings`: add SELECT policy `select_admin_settings` scoped to
     authenticated users whose email matches a row in `gpo_admins`
     (same admin-membership check used on `gpo_responses`).

## Notes
- No data is added, removed, or altered.
- The public homepage still reads event settings through the service-role
  connection (`getAdminDb`), which bypasses RLS — so this policy does not
  change how the app reads settings. It only closes the "no policy" gap.
- No INSERT/UPDATE/DELETE policy is added here because writes to
  `gpo_settings` happen only through the service-role connection in the
  admin API route, which bypasses RLS. Adding write policies would have no
  effect on the current app flow.
*/

GRANT SELECT ON public.gpo_settings TO authenticated;

DROP POLICY IF EXISTS "select_admin_settings" ON public.gpo_settings;
CREATE POLICY "select_admin_settings"
ON public.gpo_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.gpo_admins a
    WHERE a.email = lower(COALESCE((SELECT (auth.jwt() ->> 'email')), ''))
  )
);
