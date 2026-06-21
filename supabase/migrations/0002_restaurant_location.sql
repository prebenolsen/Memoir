-- ---------------------------------------------------------------------------
-- Restaurant location: capture coordinates + address from the "Find location"
-- (GPS / OpenStreetMap) flow on the food entry form, so a place is recognised
-- next time and is available for future features (map, dedupe).
-- ---------------------------------------------------------------------------
alter table memoir_restaurants
  add column if not exists latitude  double precision,
  add column if not exists longitude double precision,
  add column if not exists address   text,
  add column if not exists osm_id    text; -- "node/123" / "way/456" id for dedupe

create unique index if not exists memoir_restaurants_osm_uniq
  on memoir_restaurants (user_id, osm_id) where osm_id is not null;
