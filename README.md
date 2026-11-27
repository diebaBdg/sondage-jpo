# RAHMAH – 25 ans | Sondage JPO

Application web complète pour le sondage de participation à la Journée Portes Ouvertes (JPO) des 25 ans de l'école RAHMAH.

- **Page publique** (sans compte) : formulaire de participation très simple, utilisable depuis un téléphone.
- **Espace organisateur** (connexion e-mail + mot de passe) : statistiques, gestion des réponses, exports et paramètres de l'événement.
- **Base de données** : Supabase (PostgreSQL) avec règles de sécurité strictes (RLS).

## Technologies

React (Next.js + TypeScript), Tailwind CSS, Supabase (base de données + authentification), Recharts (graphiques), XLSX (Excel/CSV), jsPDF (PDF).

## Fonctionnalités

### Public
- Nom et prénom, numéro WhatsApp obligatoire, profil (ancien élève, parent, élève, personnel, invité, autre).
- Participation : Oui / Non / Pas encore sûr(e).
- Si présence : liste nominative des personnes (adultes et enfants vérifiés) et créneau d'arrivée.
- Commentaire facultatif + consentement obligatoire.
- Protection anti double soumission, validation côté serveur, sondage ouvrable/fermable.
- Lien personnel de modification de la réponse après envoi.

### Administration (dashboard)
- Statistiques : réponses totales, confirmées, refusées, incertaines, visiteurs estimés, adultes/enfants.
- Graphique des arrivées par créneau + créneau le plus fréquenté.
- Tableau des réponses : recherche, filtres (statut, profil, créneau), modification, suppression.
- Ajout manuel de réponses (réponses papier, téléphone…).
- Exports Excel, CSV et PDF imprimable.
- Paramètres : nom de l'événement, date, horaires, adresse, textes du sondage, créneaux horaires, ouverture/fermeture du sondage.
- Gestion des accès administrateurs (par la propriétaire du compte).

## Déploiement sur Netlify — pas à pas

### 1. Créer le dépôt GitHub
1. Créez un dépôt GitHub (par exemple `rahmah-jpo`).
2. Poussez ce projet sur la branche `main`. Ne mettez jamais le fichier `.env.local` sur GitHub.

### 2. Connecter Supabase
Les migrations SQL du dossier `supabase/migrations/` créent toutes les tables et règles de sécurité. Elles sont déjà appliquées sur le projet Supabase fourni.

Récupérez dans Supabase (**Project Settings → API**) :
- `Project URL`
- `anon public key`
- `service_role key` (secrète)

### 3. Créer le compte administrateur
1. Sur la page de connexion (`/admin`), utilisez « Créer un compte » la première fois **uniquement avec l'adresse propriétaire enregistrée**, puis définissez votre mot de passe.
2. Les autres adresses sont ajoutées depuis le tableau de bord (section « Accès administrateurs ») : la personne reçoit un e-mail d'invitation pour définir son mot de passe.
3. Aucun visiteur ne peut créer librement un compte administrateur : seules les adresses autorisées en base ont accès au tableau de bord.

### 4. Déployer sur Netlify
1. Sur [app.netlify.com](https://app.netlify.com) : **Add new site → Import an existing project**, choisissez le dépôt GitHub.
2. Netlify détecte Next.js automatiquement (configuration dans `netlify.toml`). Laissez les réglages par défaut.
3. Avant de déployer, ouvrez **Site configuration → Environment variables** et ajoutez :

| Variable | Valeur | Où la trouver |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL du projet | Supabase → Project Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | clé `anon` publique | Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | clé `service_role` **secrète** | Supabase → Project Settings → API |
| `ADMIN_EMAILS` | (facultatif) e-mails de secours séparés par des virgules | — |

4. Cliquez sur **Deploy site**. À la fin, Netlify vous donne l'adresse publique du sondage : c'est le lien à envoyer aux anciens élèves, parents et proches.

### 5. Après le déploiement
- Page publique : `https://votre-site.netlify.app/`
- Espace organisateur : `https://votre-site.netlify.app/admin`
- Pensez à renseigner la **date de la JPO** et l'**adresse** dans le tableau de bord (bouton Paramètres), la date n'est pas pré-remplie.

## Développement local

```bash
npm install
cp .env.example .env.local   # puis remplissez vos clés Supabase
npm run dev
```

## Sécurité

- La clé `service_role` n'est utilisée que côté serveur (jamais dans le navigateur, jamais sur GitHub).
- RLS activé sur toutes les tables : les visiteurs ne peuvent ni lire ni modifier les réponses des autres.
- Le sondage public peut être fermé d'un seul clic depuis le tableau de bord.
