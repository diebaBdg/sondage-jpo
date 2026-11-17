begin;

create table if not exists public.gpo_settings (
  id smallint primary key check (id = 1),
  event_date date,
  address text check (char_length(address) <= 250),
  updated_at timestamptz not null default now()
);
insert into public.gpo_settings (id) values (1) on conflict (id) do nothing;

create table if not exists public.gpo_responses (
  id uuid primary key default gen_random_uuid(),
  full_name text not null check (char_length(full_name) between 2 and 120),
  phone text not null unique check (char_length(phone) between 6 and 30),
  respondent_type text not null check (respondent_type in ('parent','alumni','student','family','friend','guest','other')),
  attendance text not null check (attendance in ('yes','no','maybe')),
  guests_total smallint not null default 0 check (guests_total between 0 and 10),
  adults smallint not null default 0 check (adults between 0 and 10),
  children smallint not null default 0 check (children between 0 and 10),
  arrival_slot text check (arrival_slot is null or arrival_slot in ('09h–10h','10h–11h','11h–12h','12h–13h','13h–14h','14h–15h','15h–16h','16h–17h')),
  comment text check (char_length(comment) <= 1000),
  consent_at timestamptz not null,
  edit_token_hash text not null unique check (edit_token_hash ~ '^[a-f0-9]{64}$'),
  created_at timestamptz not null default now(),
  constraint gpo_guest_count_matches check (
    (attendance = 'yes' and guests_total = adults + children and guests_total >= 1 and arrival_slot is not null)
    or (attendance in ('no','maybe') and guests_total = 0 and adults = 0 and children = 0 and arrival_slot is null)
  )
);

alter table public.gpo_settings enable row level security;
alter table public.gpo_responses enable row level security;
revoke all on public.gpo_settings, public.gpo_responses from anon, authenticated;
grant all on public.gpo_settings, public.gpo_responses to service_role;

-- Deliberately no anon/authenticated policies: public writes and token-authorized
-- edits go through validated server routes; all PII reads are restricted to admins.

commit;
