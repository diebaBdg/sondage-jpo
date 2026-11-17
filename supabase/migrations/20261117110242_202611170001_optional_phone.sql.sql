/*
# Téléphone optionnel + compte administrateur

1. Objectif
- Le numéro de téléphone devient optionnel dans le sondage (JPO).
- Préparation de la connexion administrateur par e-mail/mot de passe.

2. Tables modifiées
- `gpo_responses` : la colonne `phone` n'est plus NOT NULL et le doublon n'est bloqué que lorsqu'un numéro est fourni (index partiel unique). Les réponses existantes ne sont pas touchées.

3. Sécurité
- Aucun changement de RLS : les tables restent réservées au `service_role` (écritures validées côté serveur uniquement).

4. Notes
- Le compte administrateur (e-mail + mot de passe) est géré via l'authentification Supabase, appliqué juste après cette migration.
*/

ALTER TABLE public.gpo_responses ALTER COLUMN phone DROP NOT NULL;

DROP INDEX IF EXISTS public.gpo_responses_phone_unique;
CREATE UNIQUE INDEX IF NOT EXISTS gpo_responses_phone_unique
  ON public.gpo_responses (phone)
  WHERE phone IS NOT NULL;

ALTER TABLE public.gpo_responses DROP CONSTRAINT IF EXISTS gpo_phone_format;
ALTER TABLE public.gpo_responses
  ADD CONSTRAINT gpo_phone_format CHECK (phone IS NULL OR (char_length(phone) BETWEEN 6 AND 30));
