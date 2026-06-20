# Changelog

All notable changes to **Memoir** are documented here.

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR** — a brand-new feature is added.
- **MINOR** — an existing feature is changed.
- **PATCH** — minor UI/UX fixes and polish.

The current version is tracked in [`VERSION.md`](VERSION.md) and shown at the bottom
of the in-app **Settings** screen.

## [1.0.1] - 2026-06-21

Small UI/UX fixes — no feature changes.

### Fixed
- **Scrolling could get permanently stuck.** The app now uses a single dedicated
  scroll container, so scrolling always works on every page (including reaching the
  **Data** section at the bottom of Settings), even after opening and closing sheets.
- **Floating "+" button overlapped the bottom menu bar.** It now sits clearly above
  the navigation bar.
- **Quick-add pop-up actions were hidden behind the "+" button.** They now stack fully
  above it.
- **The "New project" card could fall off the bottom of the screen.** It is now
  centered on screen.

### Changed
- **Today page now has a single date control.** The redundant second date row was
  removed; clicking the date at the top opens the calendar picker directly.
- **Project switcher is now only on the Today page** instead of every page.
- **Removed the top "Add food / Add drink / Add activity" buttons** on the Food,
  Alcohol, and Activities pages — the floating "+" button already covers this.

### Added
- **App version** is now shown at the bottom of the Settings screen.

## [1.0.0] - 2026-06-20

Initial launch.

### Added
- **Projects** — create multiple projects (e.g. _Spain summer 2026_) plus a default
  _Everyday_ project; switch between them, set optional start/end dates, and delete
  non-default projects.
- **Today page** — per-day log with previous/next day navigation and a date picker;
  shows the day's food, alcohol, activities, and purchases plus a running day total.
- **Food** — log meals and restaurant visits; browse reusable Foods and Restaurants
  lists with eaten/visit counts and average ratings, with search and sorting
  (most logged, top rated, A–Z).
- **Alcohol** — log drinks (beers by 0.5L / 0.33L counts, or other drinks by quantity);
  reusable drinks list with consumption counts and average ratings.
- **Activities** — log activities; reusable activities list with completion counts and
  average ratings.
- **Purchases** — log one-off purchases with category and cost.
- **Reusable items model** — rate an item (food, drink, activity, restaurant) once and
  reuse it forever; entries are history, items are reusable, with autocomplete from
  previous input.
- **Statistics** — money totals and daily average, spend broken down by category, food
  and alcohol leaderboards (most logged / highest rated), activity and purchase
  summaries.
- **Settings** — date format, currency (NOK / EUR / USD / Other), rating scale
  (1–5 or 1–10), first day of week, and theme (light / dark / system).
- **App behavior options** — remember last project, remember last date, and confirm
  before deleting.
- **Data management** — export the current project, back up all data, import from a
  backup file, and delete a project.
- **Quick-add** — floating "+" button to quickly add food, drinks, activities, or
  purchases from anywhere.
- **Offline-safe sync** — an idempotent write queue with a persistent banner and manual
  sync when changes haven't been saved.
- **Authentication** — email/password sign-in; accounts are provisioned by an
  administrator (in-app registration is intentionally disabled).

[1.0.1]: #101---2026-06-21
[1.0.0]: #100---2026-06-20
