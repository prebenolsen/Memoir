-- ============================================================================
-- Memoir — retire memoir_activity_entries.description in favour of notes
--
-- `description` predates the activity catalog: it held free-text typed before
-- activities became reusable items. The app now captures the activity via
-- activity_item_id and uses `notes` for free text, so `description` is dead on
-- writes and read only as a legacy fallback. Fold any surviving description text
-- into `notes` (lossless — combine when a note already exists), then drop the
-- column.
--
-- Run this file once on top of 0001_init.sql … 0004_drink_coordinates.sql.
-- ============================================================================

update memoir_activity_entries
set notes = case
  when notes is null or notes = '' then description
  else description || E'\n\n' || notes
end
where description is not null and description <> '';

alter table memoir_activity_entries drop column description;
