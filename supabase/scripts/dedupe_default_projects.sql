-- ============================================================================
-- One-off cleanup: merge duplicate default projects created by the
-- AuthProvider bootstrap race (see migration 0003_unique_default_project.sql
-- for the schema fix that stops new duplicates).
--
-- For every user with more than one is_default project, picks a single
-- survivor (the one with the most linked entries, then the one with a home
-- location set, then the oldest), reassigns every entry/setting pointer from
-- the other default project(s) to it, and deletes the extras. No data is
-- lost. Safe to re-run — it's a no-op once each user has at most one
-- default project.
--
-- Destructive (deletes project rows), so this lives in scripts/, not
-- migrations/. Run manually via the Supabase SQL editor.
-- ============================================================================
do $$
declare
  u record;
  keeper uuid;
  loser record;
begin
  for u in
    select user_id
    from memoir_projects
    where is_default
    group by user_id
    having count(*) > 1
  loop
    select p.id into keeper
    from memoir_projects p
    where p.user_id = u.user_id and p.is_default
    order by
      (
        (select count(*) from memoir_food_entries     where project_id = p.id) +
        (select count(*) from memoir_drink_entries    where project_id = p.id) +
        (select count(*) from memoir_activity_entries where project_id = p.id) +
        (select count(*) from memoir_purchase_entries where project_id = p.id) +
        (select count(*) from memoir_journal_entries  where project_id = p.id)
      ) desc,
      (p.home_latitude is not null) desc,
      p.created_at asc
    limit 1;

    for loser in
      select id from memoir_projects
      where user_id = u.user_id and is_default and id <> keeper
    loop
      update memoir_food_entries     set project_id = keeper where project_id = loser.id;
      update memoir_drink_entries    set project_id = keeper where project_id = loser.id;
      update memoir_activity_entries set project_id = keeper where project_id = loser.id;
      update memoir_purchase_entries set project_id = keeper where project_id = loser.id;
      update memoir_journal_entries  set project_id = keeper where project_id = loser.id;
      update memoir_settings         set last_project_id = keeper where last_project_id = loser.id;

      delete from memoir_projects where id = loser.id;
    end loop;
  end loop;
end $$;
