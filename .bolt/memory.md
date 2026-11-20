# Project memory

## Product intent & audience

- "sondage-jpo" — survey/RSVP app for "Journées Portes Ouvertes" (Open House Days), likely for an educational institution
- Public landing page lets visitors RSVP for the event; admin dashboard lets organizers manage responses/settings
- RSVP includes: name, phone, attendance status, number of guests, arrival time slot, comments, and an edit token for later updates

## Brand personality & voice

- Not yet inferred from current context

## Visual design & UX direction

- Next.js + TypeScript stack
- Tailwind CSS 4.x for styling
- PostCSS configured
- Public landing page + admin dashboard views exist

## Decisions, constraints & rationale

- **Package manager:** pnpm; requires `pnpm-workspace.yaml` with `allowBuilds: true` for `core-js` postinstall script approval (Vercel fails install otherwise with `ERR_PNPM_IGNORED_BUILDS`)
- **Deployment:** Vercel; GitHub repo `diebaBdg/sondage-jpo` (main branch)
- **Backend:** Supabase (Postgres); service role key must be set as Vercel env var for admin functionality
- **Database:** Already created and running; 5 migrations applied; RLS enabled on all tables
  - `gpo_responses` — RSVP data (name, phone, attendance, guests, time slot, comments, edit token)
  - `gpo_admins` — authorized organizer emails (one owner registered)
  - `gpo_settings` — event date & address for public landing page
  - Settings table RLS policy added: only logged-in organizers can read directly; app reads via service connection that bypasses RLS
- **Key deps:** React 19, typescript 5.7.3, tailwindcss 4.3.3, core-js 3.51.0
- `pnpm.onlyBuiltDependencies` in `package.json` was removed; `pnpm-workspace.yaml` is the authoritative config for build approvals

## Open questions & assumptions

- Table prefix is `gpo_` despite project name "sondage-jpo" — possible naming mismatch or intentional
- Supabase project setup confirmed operational; specific project ref/URL not recorded
- No `.bolt/prompt` present; all context inferred from sessions