-- Store the exact coordinates a drink was logged at, so the Beverages stats
-- screen can plot entries on a map. The drink form already reverse-geocodes the
-- GPS fix to city/country text; this keeps the raw lat/lon alongside it.
-- Older entries (logged before this migration) simply have null coordinates and
-- are left off the map.

alter table memoir_drink_entries
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision;
