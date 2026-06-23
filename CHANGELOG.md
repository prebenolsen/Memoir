# Changelog

All notable changes to **Memoir** are documented here.

This project uses [Semantic Versioning](https://semver.org/) (`MAJOR.MINOR.PATCH`):

- **MAJOR** — a brand-new feature is added.
- **MINOR** — an existing feature is changed.
- **PATCH** — minor UI/UX fixes and polish.

The current version is tracked in [`VERSION.md`](VERSION.md) and shown at the bottom
of the in-app **Profile** screen.

## [9.0.0] - 2026-06-23

### Added
- **Stats for Everything** — selecting the "Everything" view on the Stats tab now shows aggregate statistics across every project you have, instead of asking you to pick one. It totals all food, drinks, activities and purchases ever recorded.
- **Stats date range** — a "Date range" filter at the top of the Stats tab lets you set a From and/or To date to narrow every statistic to that window. Leave both blank for all time. This works in any view and is especially handy for "Everything".

## [8.0.0] - 2026-06-23

### Added
- **Everything view** — a new "Everything" option at the top of the project switcher shows entries from all your projects in one combined Journal view. Everything is not a project; it is a global filter. New entries added while in Everything mode are saved to the default project. Stats remain per-project — selecting Everything on the Stats tab prompts you to pick a project.
- **Drink location** — drink entries now record where you were drinking. Two buttons appear in the Add/Edit drink sheet: "Use my location" uses your device GPS and reverse-geocodes it to fill in city and country automatically (great for drinking at home, on the beach, or abroad); "Find nearby" shows a list of bars and pubs within 500 m so you can confirm the venue — the city and country are filled from whichever venue you pick. Location is always optional and can be cleared.

### Changed
- **Default project name** — newly created accounts get a default project called "Everyday Life" instead of "Everyday".
- **SQL migrations** — all incremental `ALTER TABLE` migrations have been consolidated into a single clean `0001_init.sql` that creates the complete schema from scratch, making fresh deployments simpler. Existing databases should apply `0006_drink_location.sql` to pick up the new city/country columns and the `memoir_delete_account` function.

## [7.3.0] - 2026-06-23

### Added
- **Self-service sign-up** — anyone can now create a Memoir account from the login screen. Sign-in and sign-up are clearly separated: sign-in is the default view, with a "New to Memoir?" divider and a "Create account" button below. The sign-up form has email, password, and confirm-password fields with client-side match validation. After submitting, a "Check your email" confirmation screen is shown with the address used, so the user knows exactly what to look for. Supabase sends the confirmation email; the account activates on click.

## [7.2.0] - 2026-06-23

### Added
- **Delete my account** — a danger-styled button in the Account section lets a user permanently erase their profile, all projects, every entry, and all settings after confirming a plain-language warning. Calls the `memoir_delete_account` server-side RPC which removes the auth record; no recovery is possible once confirmed.

## [7.1.1] - 2026-06-23

### Fixed
- **Sign out button** — changed from ghost to secondary variant to match the other buttons in the Data section.

## [7.1.0] - 2026-06-23

### Changed
- **Rating scale** — default for new accounts is now 1–5 (was 1–10).
- **Profile icon badge** — a gold dot appears on the profile icon in the header whenever there is an incoming friend request.
- **Friends list** — users who have no username are now shown by their email address instead of "unknown".
- **Explore** — "Top rated nearby" renamed to "My nearby favorites" to make clear the list shows your own data filtered by location.

### Fixed
- **Sign-in button** — corrected a missing Tailwind height class (`h-13` → `h-14`) that left the button unstyled and visually undersized.

## [7.0.1] - 2026-06-23

### Fixed
- **Drink entries** — the Add button is now greyed out until at least one beer (or other unit) has been counted; saving a 0-amount entry is no longer possible.
- **Food entries** — the Add button now requires the correct field per source: the food name for home meals, and the restaurant/cafe name for restaurant or cafe meals.

## [7.0.0] - 2026-06-23

### Added
- **Beverage photos.** The Beverage list now shows a product photo to the left of each drink, pulled from Open Food Facts by name. Drinks with no matching photo (and generic entries like "0.33l of beer") show a placeholder instead.
- **Delete activities.** Tap an activity to open it, then use the new "Delete" button to remove it and all of its history.

### Changed
- **Cleaner item lists.** Food, drink, and restaurant items that have never been logged (0× consumed / 0 visits) are no longer shown — only items you've actually recorded appear.
- **Consistent beer & wine names.** When you type a beer or wine name by hand, it's now stored in a consistent format so every entry reads the same way — wine as "Barolo (14 %)" and beer with its size as "Hansa Pilsner 0.33l (4.7 %)".
- **Scan button moved.** In the Add/Edit drink sheet, the "Scan" button now sits at the bottom next to "Add drink" (40 / 60 split), with the add button given more room.

## [6.0.0] - 2026-06-22

### Added
- **Explore tab.** Food, Alcohol and Activities are merged into one **Explore** tab
  with sub-tabs for **Restaurants**, **Beverages** and **Activities**. Each category
  shows your latest visits and your top-rated favorites at a glance, with a **See all**
  link to the full searchable list.
- **Nearby / Mine / Friends.** A filter at the top of Explore. **Nearby** (the default)
  uses your location to surface the best-rated restaurants — yours and your friends' —
  within 5 km; **Mine** shows everything you've logged; **Friends** shows your friends'
  favorite restaurants.
- **Profile page.** A new page opened from the person icon in the top-right of every
  screen. Set a unique **username**, send and accept **friend requests** (by username
  or login email), and manage your friends.
- **Friends' favorite restaurants.** Once a friend request is accepted, you can see
  each other's favorite places (name, location and rating) in Explore.

### Changed
- **Bottom navigation** is now **Journal · Explore · Stats**.
- **Settings moved into Profile.** All settings (general, app behavior, data,
  account) now live on the Profile page; the gear on the Stats screen is gone.

> Requires the new database migration `supabase/migrations/0005_social_friends.sql`
> to be run in the Supabase dashboard before usernames and friends work.

## [5.0.0] - 2026-06-22

### Added
- **Barcode scanner.** Scan a beer or wine bottle barcode and the app looks up the product in Open Food Facts (free, no API key). Name, ABV, and bottle size (for beer) are pre-filled automatically.
- **Scan from anywhere.** The global + button now includes a "Scan barcode" action. The scanner identifies the product category and opens the drink entry sheet pre-filled — no need to navigate manually.
- **Scan inside the drink form.** A "Scan barcode" button at the top of the Add/Edit drink sheet lets you scan at any point to populate the current form.
- **Wine type auto-detection.** When a wine barcode is scanned, the category (red, white, rosé, sparkling) is detected from the product database and selected automatically.

## [4.0.0] - 2026-06-22

### Added
- **Find restaurants by map.** A new "Find restaurants" button opens an interactive map you can pan and zoom to any location in the world. A pin stays fixed at the centre; tap "Search here" to find restaurants and cafes within 200 m of that spot. Designed for planning ahead or searching somewhere you are not currently at.

### Changed
- **Smaller nearby radius.** "Find nearby restaurants" (formerly "Find location") now searches within 200 m instead of 750 m, keeping results tightly relevant to your current position.
- **Renamed button.** The GPS-based location button is now labelled "Find nearby restaurants" for clarity.

## [3.3.0] - 2026-06-22

### Changed
- **Simpler beer entry.** Beer sizes are now a single dropdown — pick the size
  (0.33l, 0.4l, 0.5l, 0.568l pint or 0.6l), then set the amount with the − / +
  stepper on the right. The size defaults to 0.33l.
- **Lower-case litres.** Volumes are now written with a small *l* (e.g. *0.5l*)
  throughout the app.

## [3.2.0] - 2026-06-22

### Added
- **More beer sizes.** Alongside 0.33l and 0.5l you can now count 0.4l, 0.6l and
  0.568l (imperial pint) servings.

### Changed
- **Drink name is now optional.** Just want to track how many beers or glasses of
  wine you had? Leave the name blank. Beers are saved as e.g. *"0.33l of beer"* and
  wines as e.g. *"A glass of red"*, based on the size or style you picked.
- **Per-type name suggestions.** Tapping the drink name now only suggests drinks of
  the matching type — beers no longer show up when you're adding a wine, and vice
  versa.
- **Smarter beer/wine defaults.** No serving size is pre-selected anymore. The name
  hint shows the size you're adding (e.g. *"0.33l of beer"*), and bumping a size fills
  the name in for you when it's still blank. The handy default names always sit at the
  top of the suggestion list for beer and wine.

## [3.1.0] - 2026-06-21

### Changed
- **Consistent drink-sheet height.** Adding a cocktail, spirit or "other" drink now
  keeps the same layout height as beer and wine, so the fields no longer jump up when
  switching type.
- **Realistic drink-name examples.** The drink-name hint now shows a fitting example
  for every type: a red, white, rosé or sparkling wine (matching the chosen style), a
  whiskey for spirits, and a cider for "other" — alongside the existing beer and
  cocktail examples.

## [3.0.0] - 2026-06-21

### Added
- **Wine subcategories.** When adding a wine, pick its style — *Red*, *White*,
  *Rosé* or *Sparkling* — right under the drink type. The style shows on the entry.
- **ABV (%) for beer and wine.** A new optional field records the strength of a
  drink. Type it in (the keyboard switches to numbers, and both `,` and `.` work as
  the decimal separator) or flick a scroll wheel to dial it in. The wheel starts at
  **12.5%** for wine and **4.7%** for beer.
- **Cocktail autocomplete.** Choosing *Cocktail* offers a searchable list of common
  cocktails (Negroni, Aperol Spritz, Margarita and more) seeded for quick picking.
  You can still type any custom name — you're never limited to the list.

## [2.0.1] - 2026-06-21

### Changed
- Renamed the **Today** tab to **Journal** and gave it a notebook icon, so the
  day-by-day log reads more like a diary.

## [2.0.0] - 2026-06-21

### Added
- **Find restaurants near you.** When adding a meal eaten out (Source: *Restaurant*
  or *Cafe*), a new **Find location** button uses your device's GPS to list nearby
  restaurants and cafes (powered by OpenStreetMap). Pick one and the name fills in
  automatically — and its location (coordinates + address) is saved with the place,
  so it's recognised next time.

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
- **The project switcher and "New project" card could fall off the screen.** They now
  open centered on screen. (Root cause: the header's backdrop blur was breaking
  `fixed` positioning; sheets now render via a portal to `<body>`.)

### Changed
- **Today page now has a single date control.** The redundant second date row was
  removed; clicking the date at the top opens the calendar picker directly.
- **Project switcher now appears on the four main tabs** (Today, Food, Alcohol,
  Activities) but not on Stats/Settings, and its card opens centered on screen.
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
