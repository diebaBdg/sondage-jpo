# Project memory

## Product intent & audience

- "sondage-jpo" — survey/poll app for "Journées Portes Ouvertes" (Open House Days events), likely for an educational institution
- Includes admin features (manage surveys/results) requiring `SUPABASE_SERVICE_ROLE_KEY` in production

## Brand personality & voice

- Not yet inferred from current context

## Visual design & UX direction

- Next.js + TypeScript stack
- Tailwind CSS 4.x for styling
- PostCSS configured

## Decisions, constraints & rationale

- **Package manager:** pnpm; requires `pnpm-workspace.yaml` with `allowBuilds: true` for `core-js` postinstall script approval (Vercel fails install otherwise with `ERR_PNPM_IGNORED_BUILDS`)
- **Deployment:** Vercel; GitHub repo `diebaBdg/sondage-jpo` (main branch)
- **Backend:** Supabase (Postgres); service role key must be set as Vercel env var for admin functionality
- **Key deps:** React 19, typescript 5.7.3, tailwindcss 4.3.3, core-js 3.51.0
- `pnpm.onlyBuiltDependencies` in `package.json` was removed; `pnpm-workspace.yaml` is the authoritative config for build approvals

## Open questions & assumptions

- Assuming "jpo" = Journées Portes Ouvertes (French open house event)
- Supabase project setup status unconfirmed (was listed as optional integration on Vercel)
- Specific admin features and survey structure not yet detailed
- No `.bolt/prompt` present; all context inferred from deployment session