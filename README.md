# Memoir

**Memoir** is a personal experience database — a place to remember the things you eat,
drink, do, and buy, and how you felt about them. You organize everything into
**projects** (e.g. _Spain summer 2026_, _Japan 2027_, plus a default _Everyday_) and
log experiences inside them across four types: **food**, **alcohol**, **activities**,
and **purchases**.

The core idea is that **entries are history, items are reusable**. You create something
like the drink _Estrella Galicia_ once and reuse it forever — so you rate the item, not
every sip, and build up a lasting record of what you've tried and what you thought of it.

### Main features

- **Projects** to keep separate trips, periods, or themes apart, with an _Everyday_
  project for day-to-day logging.
- **Four entry types** — food, alcohol, activities, and purchases — each with ratings,
  notes, and dates.
- **Reusable items** so your favorites carry across entries and projects without retyping.
- **Location tracking** to remember where an experience happened.
- **Stats** that derive counts and average ratings, giving you an at-a-glance picture of
  what you've logged.

It's meant for anyone who wants to **remember and rate** their personal experiences —
whether that's tracking the meals and drinks of a single holiday or building a long-term,
private log of everything worth remembering. Designed for **fast entry on mobile**.

## Stack

- **React + Vite + TypeScript + Tailwind CSS** (static SPA)
- **Supabase** — Postgres + Auth, all tables prefixed `memoir_`, **RLS** on every table
- **TanStack Query** for data + an idempotent **offline-safe write queue**
- **lucide-react** icons
- Hosted on **GitHub Pages** (HashRouter, no server)

## Local development

1. Install deps:
   ```bash
   npm install
   ```
2. Create the database: in the Supabase dashboard -> SQL Editor, run
   [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql).
3. Add a user: Supabase -> Authentication -> Users -> **Add user** (registration is
   disabled in the app by design).
4. Configure env: copy `.env.example` to `.env.local` and fill in your project URL and
   anon key.
   > The anon key is **public-safe** — it is meant to ship to the browser and is
   > protected by RLS. Never put the `service_role` key in this repo.
5. Run:
   ```bash
   npm run dev
   ```

## Deploy (GitHub Pages)

1. In the repo: **Settings -> Pages -> Build and deployment -> Source = GitHub Actions**.
2. Add repository secrets **`VITE_SUPABASE_URL`** and **`VITE_SUPABASE_ANON_KEY`**
   (Settings -> Secrets and variables -> Actions).
3. Push to `main`. The workflow in [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   builds and deploys.

> The Vite `base` is `/Memoir/`. If you fork under a different repo name, update
> `base` in [`vite.config.ts`](vite.config.ts).

## Data model

`Project -> (days, derived from entry dates) -> entries`. Reusable item tables back the
autocomplete; stat views derive counts and average ratings so no counters drift. See
the migration for the full schema, RLS policies, and views.
