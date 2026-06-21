# Memoir — Ideas & Feature Exploration

A wide sweep of where Memoir could go, written as a conversation between two
imagined users. Nothing here is a commitment — it's a map of possibilities so we
can pick deliberately.

> **Memoir today** is a personal experience database. You organize life into
> **projects** (trips, periods, themes, plus an _Everyday_ default) and log
> **food, alcohol, activities, and purchases** inside them. The core principle is
> _entries are history, items are reusable_ — you rate the item (a dish, a drink,
> a place), not every single occurrence. There's a **Journal** (day view), per-type
> library tabs, a **Stats** screen, and **Settings** with import/export. It's built
> mobile-first for fast entry.

---

## The two characters

### 🌙 The Dreamer — _"Memoir could be the story of my whole life."_
Wants Memoir to be a rich, beautiful, all-encompassing personal archive. Loves
detail, photos, memories, connections between things, and looking back. Will happily
spend time curating if the payoff is a treasure trove. Thinks in "wouldn't it be
amazing if…". The risk: feature bloat, an app so heavy nobody actually logs in it.

### ⚡ The Practical User — _"I have 15 seconds. Just let me log the beer."_
Wants to capture a moment and get out. Logs on mobile, often one-handed, often a
little tipsy, often weeks behind and catching up. Every extra tap is friction.
Values defaults, autocomplete, and "good enough." The risk: logs so little that
the data never becomes interesting.

> A healthy Memoir serves **both**: effortless capture (Practical) that quietly
> accumulates into something rich (Dreamer). Most ideas below are scored on that
> tension.

---

## Tab-by-tab: how it feels to use today

For each existing surface, both characters react, then we list **what's too much**,
**what could be more**, **what's missing**, and **open questions** to put to each.

---

### 📓 Journal (the day / Today screen)

The home screen. A date navigator, sections for Food / Alcohol / Activities /
Purchases for the selected day, and a running **day total** in money.

**🌙 Dreamer:** "I love that a day is a little story. But a day is more than its
receipts — where was I, who was I with, what was the weather, how did I _feel_? I'd
love a one-line 'how was today?' mood and a free-text note for the whole day, not
just per entry. And a photo for the day. Let me scroll back through months like a
diary, not just step one day at a time."

**⚡ Practical:** "The day-stepper is fine but slow when I'm catching up three days
later — I want to jump straight to a date fast, and I want 'log for yesterday' to be
one tap. The + flow is the thing I use most; it needs to be the fastest path in the
app. I almost never care about the day total in the moment."

- **Too much:** Four separate sections can feel empty/heavy on a light day. The day
  total is prominent but rarely the reason you opened the app.
- **More of:** Faster date jumping (mini calendar, "yesterday/today" chips,
  swipe-between-days). Quicker re-add of a thing you log constantly.
- **Missing:** A day-level note / mood / photo. A "this day last year" / on-this-day
  flashback. Weather auto-capture. Who you were with. A weekly or timeline scroll view
  instead of one-day-at-a-time.
- **Questions for the Dreamer:** Should a "day" be a first-class object with its own
  title, cover photo, and reflection — or stay a derived bucket of entries? Do you
  want to relive days as a continuous scrollable feed?
- **Questions for the Practical user:** What's the single most common thing you log,
  and how few taps could that be? Would a "repeat yesterday" / "same again" button
  earn its place?

---

### 🍽️ Food tab (Foods + Restaurants libraries)

Two sub-tabs (Foods, Restaurants), each a searchable, sortable list (Most logged /
Top rated / A–Z) of reusable items with counts and average ratings. Restaurants can
carry a location (with a nearby-places picker).

**🌙 Dreamer:** "This is the heart of it for me — my personal Michelin guide. I want
dish photos, the restaurant's cuisine type, price tier, who I'd recommend it to, and
a 'would return?' flag. Let me tag dishes (spicy, vegetarian, 'mum's recipe'). For
restaurants: a map of everywhere I've eaten, opening hours, a wishlist of places I
want to try."

**⚡ Practical:** "Honestly I just want 'dinner, pasta, 8/10' done in five seconds.
The starter/main/dessert split is more than I usually fill in. Autocomplete from my
own history is gold — keep making that better. Don't make me categorize."

- **Too much:** Starter / main / dessert fields are great for a fancy dinner, overkill
  for a weekday lunch. Asking source (home/restaurant/cafe) every time adds a tap.
- **More of:** Smarter autocomplete and recently-used-first ordering. One-tap re-log of
  a known dish at a known rating.
- **Missing:** Photos. Cuisine / tags. "Want to try" wishlist (restaurants & dishes).
  Map view of restaurants. Recipes / how-to for home dishes. Price tier per restaurant.
  Filter by tag or cuisine.
- **Questions for the Dreamer:** Is a restaurant a place you _rate_, a place you want a
  full _profile_ for (photos, menu highlights, map), or both? Do you want dishes linked
  to the restaurant where you had the best version?
- **Questions for the Practical user:** Would you accept one extra tap for a photo if it
  were optional and skippable, or is even the prompt too much?

---

### 🍷 Alcohol tab

A library of reusable drinks by type (beer / wine / cocktail / spirit / other), with
wine styles, ABV, beer counts by volume (0.5L / 0.33L), quantities, ratings, and
type-specific name suggestions (cocktail list, wine examples). Clearly the most
lovingly built tab.

**🌙 Dreamer:** "My cellar and tasting notebook in one. I want tasting notes
(nose/palate/finish), grape/region/vintage for wine, brewery/IBU for beer,
distillery/age for whisky. A label-photo scan. A 'cellar' of bottles I own vs.
bottles I've tried. Pairings — 'had this wine with that dish.' A flavour/region map."

**⚡ Practical:** "The beer 0.5/0.33 counters are clever and fast — keep that. But I'd
love a true one-tap 'one more of the same' when I'm on my third pint. I don't fill ABV
unless it's pre-filled. For a quick round with friends I just want a tally, not a form
per drink."

- **Too much:** For a casual night, per-drink entry with type + style + ABV is heavy.
  ABV wheel is delightful but optional for most.
- **More of:** "Same again (+1)" quick increment. Smarter type-specific defaults.
- **Missing:** Tasting notes / structured fields per type (region, vintage, brewery,
  distillery, age). Label photo. A units / standard-drinks and rough calorie estimate.
  A "cellar / want to try" list. Drink ↔ food pairing links.
- **Questions for the Dreamer:** Do you want a full bottle inventory (what you own), or
  just a tried-and-rated log? How deep should wine/whisky metadata go before it's a
  chore?
- **Questions for the Practical user:** During a night out, would you rather (a) tap +1
  on a running tally and rate later, or (b) skip individual drinks entirely and log
  "4 beers, ~7/10" once?

---

### 🎟️ Activities tab

A library of reusable activities with ratings and notes; entries carry a description,
rating, cost, date.

**🌙 Dreamer:** "This is where trips come alive — hikes, museums, concerts, that
beach. I want photos, location/map, duration, companions, and a link to tickets or
bookings. A 'bucket list' of activities I want to do, that I can tick off. Categories
(outdoors, culture, nightlife) so I can see how I spend my time."

**⚡ Practical:** "Activities are the thing I log _least_ because it feels like
homework after the fact. If logging an activity were as fast as food, I'd actually do
it. A few quick category presets would help me not stare at a blank box."

- **Too much:** The free-text description on top of an item name is a little ambiguous —
  when do I use which?
- **More of:** Quick presets/categories. Faster capture so it actually gets used.
- **Missing:** Categories/tags. Photos. Location & map. Duration / time-of-day. Bucket
  list (planned vs. done). Companions. Link to bookings/tickets.
- **Questions for the Dreamer:** Should activities have a "planned" state so the bucket
  list and the log are one feature, not two?
- **Questions for the Practical user:** Would category chips (pick one, done) make you
  log activities you currently skip?

---

### 🛍️ Purchases (currently inside Journal + Stats, no own tab)

Purchases are an entry type (item name, category: clothes/souvenir/electronics/other,
cost, notes) surfaced in the Journal and listed/added from the Stats screen — but
there's no dedicated library tab like food/drink/activities.

**🌙 Dreamer:** "Souvenirs are memories with price tags — I want photos, where I
bought it, who it was a gift for, and whether I still have/use it. For bigger buys, a
'worth it?' rating over time. This could become a personal inventory of things I own
and love."

**⚡ Practical:** "I mostly log purchases for the trip budget. I want it fast and I want
the spend to roll into stats. I don't need a whole product profile for a fridge magnet."

- **Too much / inconsistent:** Purchases live in two places and lack the reusable-item
  treatment the other types get — feels like a second-class citizen.
- **More of:** Clear home for purchases; better categories than the current four.
- **Missing:** Photos. Place of purchase / map. Gift tracking (for whom). "Still
  own/use it" + a satisfaction-over-time rating. Warranty/receipt capture.
- **Questions for the Dreamer:** Is this really two things — _trip souvenirs_ (memory)
  vs. _possessions inventory_ (ownership) — that deserve different treatment?
- **Questions for the Practical user:** Do you want purchases to stay a lightweight
  expense line, full stop?

---

### 📊 Stats tab

Per-project stats: total/daily-average spend, spend-by-category stacked bar, food
(restaurants visited, avg rating, most eaten, top rated), alcohol (beers, 0.5/0.33
totals, most consumed, top rated), activities (completed, top rated), and a purchases
list. Also the gateway to Settings.

**🌙 Dreamer:** "I want this to be _beautiful_ and revelatory. Trends over time
(am I drinking less this year?), maps of where I've been, a year-in-review / 'Memoir
Wrapped', comparisons between trips, streaks, and surprising correlations ('your
best-rated days had hikes in them'). Charts I want to screenshot and share."

**⚡ Practical:** "I check stats maybe once a trip, mostly the total spent. Give me the
one number I care about up top and let me ignore the rest. Don't make me dig."

- **Too much:** A lot of cards to scroll for someone who wants one number.
- **More of:** Time-based trends (this isn't really shown — it's all totals). Cross-
  project / all-time view. Export a chart/image.
- **Missing:** Trends over time & comparisons between projects/periods. Maps. Year in
  review. Calendar heatmap of activity. Per-rating distributions. Filters (date range,
  category). Insights/highlights surfaced automatically.
- **Questions for the Dreamer:** Which single visualization would make you say "wow"?
  A map? A trend line? A wrapped-style recap?
- **Questions for the Practical user:** If Stats showed exactly one number on open,
  which number is it — total spent, or something else?

---

### ⚙️ Settings & Projects

General prefs (date format, currency, rating scale, first day, theme), behavior
toggles (remember last project/date, confirm before delete), data export/import
(per-project and full backup, JSON), delete project, sign out, version. Projects are
created/switched elsewhere (the project switcher).

**🌙 Dreamer:** "Projects are the spine — I'd love richer projects: a cover photo, a
description, start/end dates shown as a countdown, a map of the trip, the ability to
share a read-only project with a travel companion. Templates ('new city break')."

**⚡ Practical:** "Settings is fine — I set it once. The thing I touch is switching
projects; make that one tap and sticky. Backup/export gives me peace of mind; keep it."

- **More of:** Project metadata (cover, dates, location), project templates, fast switch.
- **Missing:** Cloud-y conveniences: sharing/collaboration, reminders/notifications,
  search across everything, tags taxonomy management, units (metric/imperial), language.
- **Questions for the Dreamer:** Do you want to _share_ projects, or is Memoir strictly
  private and personal?
- **Questions for the Practical user:** Would a daily "don't forget to log" nudge help,
  or would it annoy you into uninstalling?

---

## Cross-cutting wishes (apply to every tab)

These came up again and again above — likely higher leverage than any single tab.

- **Photos everywhere.** A photo per entry/item is the #1 Dreamer ask and the single
  biggest step toward Memoir feeling like a memory archive, not a spreadsheet.
- **Global search.** One search box across food, drinks, activities, places, people,
  notes. ("Where did I have that amazing octopus?")
- **Tags / labels.** A flexible cross-type tagging system (people, places, moods,
  themes) that powers filtering and the connections the Dreamer wants.
- **Location & maps.** Already partially there for restaurants — extend to activities
  and purchases, then a map view of "everywhere this project happened."
- **"Same again" quick re-log.** The Practical user's killer feature — one tap to repeat
  a previous entry with today's date.
- **On this day / flashbacks.** Resurface past entries to make the archive feel alive.
- **Reminders & nudges.** Optional gentle prompts to log (and to catch up after a trip).
- **Companions / "with whom".** Links entries to people (see People idea below).
- **Year in review / "Memoir Wrapped".** A shareable, beautiful annual recap.
- **AI assists (optional, dual-use):** photo → auto-suggest dish/drink name; free-text
  "had tapas and two beers at Bar X, 8/10" → parsed entries; smart tasting-note prompts;
  natural-language search.

---

## Beyond food & drink — what _else_ could Memoir hold?

Memoir = "a record of memories." The current four types are one slice. Ideas for new
top-level areas, each with how the two characters might react.

### 👤 People
A directory of the people in your life — partners, friends, family, colleagues,
people you meet while travelling.
- **Fields:** name, photo, how you met, birthday, contact, notes, "facts to remember"
  (their kids' names, allergies, coffee order), important dates.
- **Connections:** tag people into food/activity/trip entries → "everything I've done
  with Anna," "restaurants we both loved."
- **🌙:** "A relationship CRM for my actual life — never forget a birthday or that they
  hate cilantro." **⚡:** "Just birthdays and a notes box is enough; don't make me a
  data-entry clerk for my friends."

### ⭐ Dream list / Bucket list
Things you want to do, see, eat, drink, own, or visit — the aspirational mirror of the
log.
- One unified "wishlist" that spans types, with a "done → becomes a logged entry" flow.
- **🌙:** "My life's want-list in one place, with photos and inspiration links."
  **⚡:** "A simple checklist I can dump into and tick off."

### ✅ To-do / Tasks
Lightweight tasks, possibly project-scoped (trip prep: book hotel, get adapter).
- **⚡ loves this** for trip logistics; **🌙** wants it linked to projects and dates.
- Risk: every app becomes a to-do app. Keep it minimal and trip/project-flavored, or it
  competes with dedicated tools.

### 📚 Media / Culture log
Books, films, TV, games, podcasts, music — things consumed, rated, and remembered.
- Same engine as food/drink: reusable items + ratings + notes + "want to" list.
- **🌙:** "My Goodreads + Letterboxd, private and unified." **⚡:** "Title + stars,
  done."

### ✈️ Places / Travel
Cities, countries, landmarks visited — a passport/map of your life.
- Auto-derive from projects with locations; add a world map with pins and stats
  ("23 cities, 9 countries").

### 🌅 Memories / Journal entries
Free-form dated journaling with photos and mood — the diary the Journal tab hints at
but doesn't fully provide. The connective tissue that turns logs into a life story.

### 🩺 Health & habits (more sensitive)
Mood, sleep, exercise, weight, habits/streaks. Pairs naturally with the alcohol
units/standard-drinks idea.
- **🌙:** "The full picture of me." **⚡:** "Careful — this starts feeling like a chore
  and a guilt machine." Treat as opt-in, keep it gentle, mind the privacy weight.

### 🎁 Gifts
Gifts given and received, ideas for future gifts per person (links to People).

### 🏠 Possessions / Inventory
The "do I still own/use it" evolution of Purchases — warranties, value, what to sell.

---

## How to think about prioritization

A rough read of impact vs. effort, balancing both characters:

**High impact, foundational (do early):**
- Photos on entries/items (unlocks the whole "memory archive" identity)
- "Same again" quick re-log + faster date jumping (wins the Practical user)
- Global search + a tagging system (unlocks connections the Dreamer wants)

**High delight, contained:**
- On-this-day flashbacks
- Year-in-review / Wrapped
- Map view for places/restaurants
- Alcohol "+1 same again" tally mode

**Big bets / new areas (validate demand first):**
- People directory + companion tagging
- Dream/bucket list (with done→entry flow)
- Media/culture log
- A true day-level Journal/diary entry

**Handle with care:**
- Health & habits (privacy, guilt, scope creep)
- To-do (risk of competing with dedicated apps — keep it trip-scoped)

**Guiding principle:** every new feature should make capture _faster_ for the
Practical user or _richer_ for the Dreamer — ideally let the Practical user's quick
taps quietly produce the Dreamer's rich archive. Anything that only adds friction
without adding future joy is the thing to cut.

---

## Questions to settle before building anything

1. **Identity:** Is Memoir a _fast logger_ that happens to accumulate memories, or a
   _memory archive_ that happens to need logging? The answer reorders everything above.
2. **Scope:** Stay food/drink/activity-focused and go _deep_, or expand into a
   life-OS (people, media, dreams, health) and go _wide_?
3. **Private vs. shared:** Always strictly personal, or eventually shareable/collab?
4. **Effort budget per entry:** What's the maximum taps you'll tolerate for the most
   common log? Design the fast path to that number and make everything else optional.
5. **The one "wow":** If we could ship a single delightful thing this year, is it
   photos, a map, Wrapped, or something else?
