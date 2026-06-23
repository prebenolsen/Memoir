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

commit;
