-- ============================================================================
-- Memoir — DROP ALL TABLES
-- ============================================================================
-- DANGER: This permanently deletes every Memoir table and all data in them.
-- There is no undo. Only run this against a database you intend to wipe
-- (e.g. a local/dev Supabase project) after taking a backup if needed.
--
-- `cascade` also removes dependent objects (RLS policies, triggers, foreign
-- keys, indexes) so the tables can be dropped regardless of their order.
--
-- Run in the Supabase SQL editor or via psql:
--   psql "$DATABASE_URL" -f supabase/drop_all_tables.sql
-- ============================================================================

begin;

-- Stat views (cascade on the tables drops these too, but be explicit)
drop view if exists memoir_food_item_stats     cascade;
drop view if exists memoir_restaurant_stats    cascade;
drop view if exists memoir_drink_item_stats    cascade;
drop view if exists memoir_activity_item_stats cascade;

-- Entries (child tables — reference items/restaurants/projects)
drop table if exists memoir_food_entries cascade;
drop table if exists memoir_drink_entries cascade;
drop table if exists memoir_activity_entries cascade;
drop table if exists memoir_purchase_entries cascade;

-- Reusable catalog items
drop table if exists memoir_food_items cascade;
drop table if exists memoir_restaurants cascade;
drop table if exists memoir_drink_items cascade;
drop table if exists memoir_activity_items cascade;

-- Projects & settings
drop table if exists memoir_projects cascade;
drop table if exists memoir_settings cascade;

-- Social
drop table if exists memoir_friendships cascade;
drop table if exists memoir_profiles cascade;

-- Functions (helpers + RPCs)
drop function if exists memoir_apply_owner_rls(regclass);
drop function if exists memoir_are_friends(uuid, uuid);
drop function if exists memoir_find_profile(text);
drop function if exists memoir_friend_restaurant_favorites();
drop function if exists memoir_delete_account();

-- Enums (dropped last — tables that use them are already gone)
drop type if exists memoir_meal_type        cascade;
drop type if exists memoir_food_source      cascade;
drop type if exists memoir_drink_type       cascade;
drop type if exists memoir_purchase_category cascade;

commit;
