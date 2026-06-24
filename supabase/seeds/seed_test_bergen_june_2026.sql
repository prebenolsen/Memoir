-- ============================================================================
-- Seed data — "Bergen, June 2026" trip for the test user (test@test.com)
--
-- A made-up week in Bergen: a handful of restaurant meals, a few beers, some
-- souvenir/clothing purchases, and a few activities. Everything is scoped to a
-- single project and the test user, so it's easy to delete again (see bottom).
--
-- Safe to re-run: it cleans up the previous "Bergen 2026" project for this user
-- before re-inserting. All costs are in NOK to match the default currency.
--
-- Usage (psql / Supabase SQL editor):
--   \i supabase/seed_test_bergen_june_2026.sql
-- ============================================================================

do $$
declare
  v_user_id uuid;
  v_project_id uuid;

  -- reusable item ids
  r_bryggeloftet uuid;
  r_pingvinen    uuid;
  r_bare         uuid;
  r_trekroneren  uuid;
  r_fishme       uuid;

  d_hansa  uuid;
  d_voss   uuid;
  d_7fjell uuid;
  d_kinn   uuid;

  f_fishsoup   uuid;
  f_reindeer   uuid;
  f_fishcake   uuid;
  f_hotdog     uuid;
  f_wholefish  uuid;

  a_floibanen uuid;
  a_ulriken   uuid;
  a_bryggen   uuid;
  a_fjord     uuid;
  a_aquarium  uuid;
begin
  -- --------------------------------------------------------------------------
  -- Resolve the test user. Abort cleanly if the account doesn't exist.
  -- --------------------------------------------------------------------------
  select id into v_user_id from auth.users where email = 'test@test.com';
  if v_user_id is null then
    raise exception 'No auth.users row for test@test.com — create the account first.';
  end if;

  -- --------------------------------------------------------------------------
  -- Clean slate: drop any prior run of this project (cascades to its entries).
  -- --------------------------------------------------------------------------
  delete from memoir_projects
   where user_id = v_user_id and name = 'Bergen 2026';

  -- --------------------------------------------------------------------------
  -- Project
  -- --------------------------------------------------------------------------
  insert into memoir_projects (user_id, name, start_date, end_date, is_default)
  values (v_user_id, 'Bergen 2026', date '2026-06-08', date '2026-06-14', false)
  returning id into v_project_id;

  -- --------------------------------------------------------------------------
  -- Reusable items (upsert by unique (user_id, lower(name)) so re-runs are ok)
  -- --------------------------------------------------------------------------

  -- Restaurants (with rough Bryggen-area coordinates)
  insert into memoir_venues (user_id, name, default_rating, latitude, longitude, address, notes)
  values (v_user_id, 'Bryggeloftet & Stuene', 8, 60.3972, 5.3225, 'Bryggen 11, 5003 Bergen', 'Classic Norwegian, on the old wharf')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into r_bryggeloftet;

  insert into memoir_venues (user_id, name, default_rating, latitude, longitude, address, notes)
  values (v_user_id, 'Pingvinen', 9, 60.3897, 5.3215, 'Vaskerelven 14, 5014 Bergen', 'Cosy local pub, traditional dishes')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into r_pingvinen;

  insert into memoir_venues (user_id, name, default_rating, latitude, longitude, address, notes)
  values (v_user_id, 'Bare Vestland', 8, 60.3935, 5.3242, 'Torgallmenningen 2, 5014 Bergen', 'Modern west-coast tasting menu')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into r_bare;

  insert into memoir_venues (user_id, name, default_rating, latitude, longitude, address, notes)
  values (v_user_id, 'Trekroneren', 7, 60.3925, 5.3245, 'Kong Oscars gate 1, 5017 Bergen', 'Famous reindeer hot dog stand')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into r_trekroneren;

  insert into memoir_venues (user_id, name, default_rating, latitude, longitude, address, notes)
  values (v_user_id, 'Fish Me', 8, 60.3955, 5.3251, 'Zachariasbryggen, 5014 Bergen', 'Seafood by the harbour')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into r_fishme;

  -- Drinks (local Bergen / Norwegian beers)
  insert into memoir_drink_items (user_id, name, drink_type, default_rating, notes)
  values (v_user_id, 'Hansa Pils', 'beer', 7, 'The local Bergen lager')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into d_hansa;

  insert into memoir_drink_items (user_id, name, drink_type, default_rating, notes)
  values (v_user_id, 'Voss Pils', 'beer', 6, NULL)
  on conflict (user_id, lower(name)) do update set drink_type = excluded.drink_type
  returning id into d_voss;

  insert into memoir_drink_items (user_id, name, drink_type, default_rating, notes)
  values (v_user_id, '7 Fjell IPA', 'beer', 9, 'Local Bergen microbrewery')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into d_7fjell;

  insert into memoir_drink_items (user_id, name, drink_type, default_rating, notes)
  values (v_user_id, 'Kinn Vestkyst', 'beer', 8, 'Pale ale from Sunnfjord')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into d_kinn;

  -- Food items
  insert into memoir_food_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Bergen fish soup', 9, 'Creamy local classic')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into f_fishsoup;

  insert into memoir_food_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Reindeer stew', 8, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into f_reindeer;

  insert into memoir_food_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Fish cakes', 7, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into f_fishcake;

  insert into memoir_food_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Reindeer hot dog', 7, 'From Trekroneren')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into f_hotdog;

  insert into memoir_food_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Grilled catch of the day', 9, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into f_wholefish;

  -- Activities
  insert into memoir_activity_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Fløibanen funicular', 9, 'Up Mount Fløyen for the view')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into a_floibanen;

  insert into memoir_activity_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Ulriken cable car', 8, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into a_ulriken;

  insert into memoir_activity_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Bryggen walking tour', 8, 'Hanseatic wharf, UNESCO site')
  on conflict (user_id, lower(name)) do update set notes = excluded.notes
  returning id into a_bryggen;

  insert into memoir_activity_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Mostraumen fjord cruise', 10, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into a_fjord;

  insert into memoir_activity_items (user_id, name, default_rating, notes)
  values (v_user_id, 'Bergen Aquarium', 6, NULL)
  on conflict (user_id, lower(name)) do update set default_rating = excluded.default_rating
  returning id into a_aquarium;

  -- --------------------------------------------------------------------------
  -- Food entries (history)
  -- --------------------------------------------------------------------------
  insert into memoir_food_entries
    (user_id, project_id, entry_date, meal_type, source, food_item_id, venue_id, starter, main_course, dessert, rating, cost, notes)
  values
    (v_user_id, v_project_id, '2026-06-08', 'dinner', 'venue', f_fishsoup,  r_bryggeloftet, 'Bergen fish soup', 'Bacalao', 'Cloudberry cream', 9, 645.00, 'Great first night on the wharf'),
    (v_user_id, v_project_id, '2026-06-09', 'lunch',  'venue', f_hotdog,    r_trekroneren,  NULL, 'Reindeer hot dog', NULL, 7, 95.00,  'Quick street-food lunch'),
    (v_user_id, v_project_id, '2026-06-09', 'dinner', 'venue', f_reindeer,  r_pingvinen,    NULL, 'Reindeer stew', 'Apple cake', 9, 410.00, 'Cosy pub, packed'),
    (v_user_id, v_project_id, '2026-06-10', 'lunch',  'venue', f_fishcake,  r_pingvinen,    NULL, 'Fish cakes with potatoes', NULL, 7, 245.00, NULL),
    (v_user_id, v_project_id, '2026-06-11', 'dinner', 'venue', f_wholefish, r_fishme,       'Shrimp', 'Grilled halibut', NULL, 8, 720.00, 'By the harbour at sunset'),
    (v_user_id, v_project_id, '2026-06-12', 'dinner', 'venue', NULL,        r_bare,         'Scallop', 'West-coast tasting menu', 'Brown cheese ice cream', 9, 1290.00, 'Splurge night'),
    (v_user_id, v_project_id, '2026-06-13', 'breakfast', 'venue', NULL,     NULL,           NULL, 'Skillingsbolle & coffee', NULL, 8, 110.00, 'Cinnamon bun by the fish market');

  -- --------------------------------------------------------------------------
  -- Drink entries (history) — count_* columns track the various glass/bottle
  -- sizes (0.33 / 0.4 / 0.5 / 0.568 / 0.6 L); abv and city/country record the
  -- strength and where it was drunk. wine_style stays null (these are all beer).
  -- --------------------------------------------------------------------------
  insert into memoir_drink_entries
    (user_id, project_id, entry_date, drink_item_id, drink_type, abv,
     count_033l, count_04l, count_05l, count_0568l, count_06l,
     quantity, rating, cost, city, country, notes)
  values
    (v_user_id, v_project_id, '2026-06-08', d_hansa,  'beer', 4.5, 0, 0, 2, 0, 0, 2, 7, 196.00, 'Bergen', 'Norway', 'With dinner'),
    (v_user_id, v_project_id, '2026-06-09', d_7fjell, 'beer', 6.5, 0, 1, 0, 0, 0, 1, 9, 119.00, 'Bergen', 'Norway', 'At the brewery taproom'),
    (v_user_id, v_project_id, '2026-06-09', d_hansa,  'beer', 4.5, 0, 0, 1, 0, 0, 1, 7, 98.00,  'Bergen', 'Norway', NULL),
    (v_user_id, v_project_id, '2026-06-11', d_kinn,   'beer', 4.7, 2, 0, 0, 0, 0, 2, 8, 178.00, 'Bergen', 'Norway', 'With the seafood'),
    (v_user_id, v_project_id, '2026-06-12', d_7fjell, 'beer', 6.5, 0, 1, 0, 0, 0, 1, 9, 125.00, 'Bergen', 'Norway', NULL),
    (v_user_id, v_project_id, '2026-06-13', d_voss,   'beer', 4.5, 0, 0, 1, 0, 0, 1, 6, 95.00,  'Bergen', 'Norway', 'Nightcap');

  -- --------------------------------------------------------------------------
  -- Activity entries (history)
  -- --------------------------------------------------------------------------
  insert into memoir_activity_entries
    (user_id, project_id, entry_date, activity_item_id, rating, cost, notes)
  values
    (v_user_id, v_project_id, '2026-06-08', a_bryggen,   8, 0.00, 'Afternoon stroll through the old Hanseatic wharf. Free to wander'),
    (v_user_id, v_project_id, '2026-06-09', a_floibanen, 9, 160.00, 'Funicular up Mount Fløyen, hiked back down. Clear views over the city'),
    (v_user_id, v_project_id, '2026-06-10', a_fjord,     10, 690.00, 'Mostraumen fjord cruise from the harbour. Waterfalls and tidal rapids — highlight of the trip'),
    (v_user_id, v_project_id, '2026-06-11', a_ulriken,   8, 295.00, 'Cable car up Mount Ulriken'),
    (v_user_id, v_project_id, '2026-06-12', a_aquarium,  6, 320.00, 'Bergen Aquarium in the morning. A bit small');

  -- --------------------------------------------------------------------------
  -- Purchases (history)
  -- --------------------------------------------------------------------------
  insert into memoir_purchase_entries
    (user_id, project_id, entry_date, item_name, category, cost, notes)
  values
    (v_user_id, v_project_id, '2026-06-08', 'Rain jacket',           'clothes',    1499.00, 'Needed it — rained the first day'),
    (v_user_id, v_project_id, '2026-06-10', 'Norwegian wool sweater','clothes',    2190.00, 'Lusekofte from Husfliden'),
    (v_user_id, v_project_id, '2026-06-10', 'Troll figurine',        'souvenir',   249.00,  'For the shelf'),
    (v_user_id, v_project_id, '2026-06-11', 'Bryggen postcards',     'souvenir',   89.00,   'Pack of 6'),
    (v_user_id, v_project_id, '2026-06-12', 'Jar of cloudberry jam', 'other',      159.00,  'From the fish market'),
    (v_user_id, v_project_id, '2026-06-13', 'Travel adapter',        'electronics',199.00,  NULL);

  raise notice 'Seeded Bergen 2026 trip for % (project %)', v_user_id, v_project_id;
end $$;

-- ============================================================================
-- To remove this seed data later:
--   delete from memoir_projects
--    where name = 'Bergen 2026'
--      and user_id = (select id from auth.users where email = 'test@test.com');
-- (Entries cascade with the project. The reusable items above are left in place
--  on purpose — delete them by name from memoir_venues / memoir_drink_items
--  / memoir_food_items / memoir_activity_items if you want a full teardown.)
-- ============================================================================
