-- ============================================================================
-- Memoir — DROP EVERYTHING
-- ============================================================================
-- DANGER: This permanently deletes every Memoir object and all data in it.
-- There is no undo. Only run this against a database you intend to wipe
-- (e.g. a local/dev Supabase project) after taking a backup if needed.
--
-- This drops every object in the `public` schema whose name starts with
-- `memoir_` — tables, views, functions, and enum types — discovered dynamically
-- from the catalog. Because it loops over what actually exists and uses
-- `cascade`, it cannot fail on a missing or renamed object, and it always wipes
-- the schema completely so 0001_init.sql can be re-run from a clean slate.
--
-- Run in the Supabase SQL editor or via psql:
--   psql "$DATABASE_URL" -f supabase/scripts/drop_all_tables.sql
-- ============================================================================

do $$
declare
  r record;
begin
  -- Views first (they depend on tables).
  for r in
    select table_name from information_schema.views
    where table_schema = 'public' and table_name like 'memoir\_%'
  loop
    execute format('drop view if exists public.%I cascade', r.table_name);
  end loop;

  -- Tables (cascade clears their RLS policies, indexes, and FKs).
  for r in
    select tablename from pg_tables
    where schemaname = 'public' and tablename like 'memoir\_%'
  loop
    execute format('drop table if exists public.%I cascade', r.tablename);
  end loop;

  -- Functions / RPCs (regprocedure carries the full signature).
  for r in
    select p.oid::regprocedure as fn
    from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname like 'memoir\_%'
  loop
    execute format('drop function if exists %s cascade', r.fn);
  end loop;

  -- Enum types last (the tables that used them are already gone).
  for r in
    select t.typname
    from pg_type t
    join pg_namespace n on n.oid = t.typnamespace
    where n.nspname = 'public' and t.typname like 'memoir\_%' and t.typtype = 'e'
  loop
    execute format('drop type if exists public.%I cascade', r.typname);
  end loop;
end $$;
