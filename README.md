# Memoir

So you know how you go on a trip, eat something amazing, have a few great beers, do a
cool thing — and then a year later you can't remember the name of any of it? **Memoir**
is my fix for that. It's a little app where I log the stuff I eat, drink, do, and buy,
give it a rating, and never lose track of it again.

The trick that makes it click: **you log a thing once, and reuse it forever.** I add
_Estrella Galicia_ as a beer one time, rate it, and from then on every time I have one I
just tap it — no retyping, no re-rating. So over time the app quietly builds up this
list of everything I've tried and what I actually thought of it. The individual times I
had it are just history; the beer itself is the thing that sticks around.

Everything lives inside **projects**, which are basically just buckets to keep things
separate. I've got an everyday one for normal life, and then I spin up a new one for each
trip — _Spain summer 2026_, _Japan 2027_, whatever. Each project can even have its own
currency, so my Spain trip tracks euros without messing up my usual kroner. And if I want
to see everything at once across all of them, there's an "Everything" view for that too.

It's built for the phone, for logging things fast in the moment — you're standing at the
bar, you tap a few times, done. The whole point is that it's low-effort enough that I
actually keep doing it.

### Main features

- **Projects for trips and life.** Keep each trip, period, or theme in its own bucket,
  with an everyday project for normal life and an **Everything** view that mashes them
  all together. Projects can have their own currency, so a trip abroad tracks its costs
  in the local money without touching your default.
- **Log four kinds of things** — **food** (meals in or out, even split into
  starter/main/dessert), **drinks** (beer by size, wine by style, cocktails, spirits),
  **activities**, and **purchases**. Everything gets a rating, notes, and a date.
- **Log it once, reuse it forever.** Rate a beer, a dish, a restaurant, or an activity a
  single time and it carries across every entry and every project — no retyping, no
  re-rating.
- **Scan a barcode.** Point your phone at a beer or wine bottle and it looks the product
  up automatically — name, strength, and bottle size all filled in for you. There's even
  a quick double-tap on the + button to jump straight into scanning.
- **Remember where you were.** Meals and drinks can grab your location — use your GPS, or
  pull up a list of nearby restaurants/bars and just pick the one you're at. Great for
  "where was that little place we found?"
- **Explore your own taste.** A whole tab for browsing what you've logged — your latest
  visits and your top-rated favorites for restaurants, drinks, and activities. Filter by
  what's **nearby**, what's **yours**, or what your **friends** love.
- **Friends.** Set a username, add friends, and see each other's favorite restaurants —
  so you can steal each other's good recommendations.
- **Stats that actually tell you something.** Money totals, spend by category,
  leaderboards for your most-logged and highest-rated food and drinks, how many beers and
  litres you've put away, wine by style — all filterable by date range.
- **Works offline.** Log stuff with no signal and it syncs up safely when you're back
  online, so you never lose an entry.

It's for anyone who wants to **remember and rate** the good stuff in life — whether
that's nailing down every meal and drink of one holiday, or quietly building a private
record of everything worth remembering over the years.

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
