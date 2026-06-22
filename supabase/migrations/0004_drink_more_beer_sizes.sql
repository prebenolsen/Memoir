-- ---------------------------------------------------------------------------
-- More beer serving sizes. In addition to the original 0.33L and 0.5L counts,
-- a drink entry can now record 0.4L, 0.568L (imperial pint) and 0.6L servings.
-- Each size has its own integer counter, defaulting to 0 like the originals.
-- ---------------------------------------------------------------------------
alter table memoir_drink_entries
  add column if not exists count_04l int not null default 0,
  add column if not exists count_0568l int not null default 0,
  add column if not exists count_06l int not null default 0;
