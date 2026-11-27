/*
# Élargissement des réglages événement et ajout du profil "Membre du personnel"

1. Table `gpo_settings` — nouvelles colonnes
- `event_name` (text, ≤120) : nom de l'événement affiché publiquement.
- `opening_hours` (text, ≤120) : horaires d'ouverture de la JPO.
- `intro_text` (text, ≤500) : texte d'introduction du sondage public.
- `confirmation_message` (text, ≤300) : message affiché après l'envoi du formulaire.
- `survey_open` (boolean, défaut true) : ouvre ou ferme le sondage public.
- `arrival_slots` (jsonb) : liste des créneaux horaires d'arrivée, modifiable depuis l'administration.

2. Table `gpo_responses`
- Le contrôle `respondent_type` accepte désormais la valeur 'staff' (membre du personnel).
- Le contrôle strict sur `arrival_slot` est retiré : les créneaux valides sont désormais
  validés côté serveur à partir de la configuration (les créneaux sont personnalisables).

3. Valeurs par défaut
- La ligne de réglages existante reçoit un nom d'événement, des horaires, un message de
  confirmation et la liste de créneaux par défaut (spec RAHMAH 25 ans).

4. Sécurité
- Aucun changement : RLS déjà actif sur les deux tables, accès uniquement via le serveur
  (service_role), aucune nouvelle politique nécessaire.
*/

alter table public.gpo_settings
  add column if not exists event_name text,
  add column if not exists opening_hours text,
  add column if not exists intro_text text,
  add column if not exists confirmation_message text,
  add column if not exists survey_open boolean not null default true,
  add column if not exists arrival_slots jsonb not null default '["09h00 – 10h00","10h00 – 11h00","11h00 – 12h00","12h00 – 13h00","13h00 – 14h00","Après 14h00","Je ne sais pas encore"]'::jsonb;

do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'gpo_settings_event_name_check') then
    alter table public.gpo_settings add constraint gpo_settings_event_name_check check (event_name is null or char_length(event_name) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gpo_settings_opening_hours_check') then
    alter table public.gpo_settings add constraint gpo_settings_opening_hours_check check (opening_hours is null or char_length(opening_hours) <= 120);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gpo_settings_intro_text_check') then
    alter table public.gpo_settings add constraint gpo_settings_intro_text_check check (intro_text is null or char_length(intro_text) <= 500);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gpo_settings_confirmation_message_check') then
    alter table public.gpo_settings add constraint gpo_settings_confirmation_message_check check (confirmation_message is null or char_length(confirmation_message) <= 300);
  end if;
  if not exists (select 1 from pg_constraint where conname = 'gpo_settings_arrival_slots_check') then
    alter table public.gpo_settings add constraint gpo_settings_arrival_slots_check check (jsonb_typeof(arrival_slots) = 'array' and jsonb_array_length(arrival_slots) between 1 and 12);
  end if;
end $$;

update public.gpo_settings set
  event_name = coalesce(event_name, 'Journée Portes Ouvertes – 25 ans de RAHMAH'),
  opening_hours = coalesce(opening_hours, 'De 9 h à 17 h'),
  confirmation_message = coalesce(confirmation_message, 'Merci pour votre réponse ! Votre participation nous aide à mieux préparer cette belle journée. À très bientôt, in sha Allah !')
where id = 1;

alter table public.gpo_responses drop constraint if exists gpo_responses_respondent_type_check;
alter table public.gpo_responses add constraint gpo_responses_respondent_type_check
  check (respondent_type = any (array['parent','alumni','student','staff','family','friend','guest','other']));

alter table public.gpo_responses drop constraint if exists gpo_responses_arrival_slot_check;
