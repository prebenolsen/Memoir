-- ---------------------------------------------------------------------------
-- Drink details: optional ABV (%) for beer/wine and a wine subcategory
-- (red / white / rosé / sparkling). ABV is stored numerically so the decimal
-- separator is always normalised to "." regardless of how the user typed it.
-- ---------------------------------------------------------------------------
alter table memoir_drink_entries
  add column if not exists abv numeric(4, 1)
    check (abv is null or (abv >= 0 and abv <= 100)),
  add column if not exists wine_style text
    check (wine_style is null or wine_style in ('red', 'white', 'rose', 'sparkling'));
