begin;

create table if not exists public.gpo_admins (
  email text primary key check (email = lower(email) and char_length(email) <= 254),
  is_owner boolean not null default false,
  created_at timestamptz not null default now()
);

insert into public.gpo_admins (email, is_owner)
values ('dienabafilybodiang@gmail.com', true)
on conflict (email) do update set is_owner = true;

alter table public.gpo_admins enable row level security;
revoke all on public.gpo_admins from anon, authenticated;
grant all on public.gpo_admins to service_role;

alter table public.gpo_responses
  add column if not exists attendees jsonb not null default '[]'::jsonb;

commit;
