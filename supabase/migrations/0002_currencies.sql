-- ============================================================================
-- Memoir — currency reference database (SCD2 / slowly-changing dimension)
--
-- A small, shared reference table of currencies and their exchange rate to NOK.
-- It is NOT per-user: every user reads the same rates. You (the owner) keep the
-- rates current by running SQL manually from the Supabase SQL Editor — the app
-- only ever reads this table, it never writes to it.
--
-- SCD2 history: each currency keeps every rate it has ever had. A row is the
-- "current" rate while its __end_at is NULL; when you set a new rate the old row
-- is closed (its __end_at is stamped) and a fresh open row is inserted. So the
-- whole history is queryable, and "the latest rate" is simply __end_at IS NULL.
--
-- Run this file once on top of 0001_init.sql. See supabase/CURRENCIES.md for the
-- step-by-step guide on updating prices.
-- ============================================================================

create table if not exists memoir_currencies (
  id            uuid primary key default gen_random_uuid(),
  code          text not null,                       -- ISO code, e.g. 'NOK', 'EUR', 'USD'
  name          text not null,                       -- human name, e.g. 'Norwegian krone'
  symbol        text not null,                       -- display symbol, e.g. 'kr', '€', '$'
  symbol_before boolean not null default false,      -- true => '€10', false => '10 kr'
  rate_to_nok   numeric(18, 6) not null,             -- how many NOK = 1 unit of this currency
  __start_at    timestamptz not null default now(),  -- when this rate took effect
  __end_at      timestamptz                          -- NULL = current rate; set = superseded
);

-- At most one current (open) row per currency code.
create unique index if not exists memoir_currencies_current_uniq
  on memoir_currencies (code) where __end_at is null;
-- Fast history lookups by code.
create index if not exists memoir_currencies_code_idx on memoir_currencies (code);

-- ---------------------------------------------------------------------------
-- RLS: shared reference data. Any signed-in user may READ it; nobody writes
-- through the API. Updates happen only from the SQL Editor (the `postgres`
-- role bypasses RLS), which is exactly the "I must run it manually" model.
-- ---------------------------------------------------------------------------
alter table memoir_currencies enable row level security;
alter table memoir_currencies force row level security;
grant select on memoir_currencies to authenticated;

drop policy if exists currencies_select on memoir_currencies;
create policy currencies_select on memoir_currencies
  for select to authenticated using (true);
-- Note: no insert/update/delete policies on purpose — writes are owner-only.

-- ---------------------------------------------------------------------------
-- Convenience view: just the current rates (one row per currency). The app
-- reads this to populate the currency picker. security_invoker so the reader's
-- RLS (select-only) applies.
-- ---------------------------------------------------------------------------
create or replace view memoir_currencies_current with (security_invoker = true) as
select id, code, name, symbol, symbol_before, rate_to_nok, __start_at
from memoir_currencies
where __end_at is null;

grant select on memoir_currencies_current to authenticated;

-- ---------------------------------------------------------------------------
-- Helper: set a currency's rate the SCD2 way in one call. Closes the current
-- open row (if any) and inserts a new open row, carrying forward name/symbol
-- unless you override them. For a brand-new currency, pass name + symbol too.
--
-- Run from the SQL Editor, e.g.:
--   select memoir_set_currency_rate('EUR', 11.62);              -- new rate only
--   select memoir_set_currency_rate('GBP', 13.40, 'British pound', '£', true);  -- new currency
--
-- Not granted to the app role: this is an owner-only maintenance function.
-- ---------------------------------------------------------------------------
create or replace function memoir_set_currency_rate(
  p_code          text,
  p_rate          numeric,
  p_name          text    default null,
  p_symbol        text    default null,
  p_symbol_before boolean default null
) returns void
language plpgsql
as $$
declare
  cur memoir_currencies%rowtype;
begin
  select * into cur from memoir_currencies where code = p_code and __end_at is null;

  if found then
    -- Same rate? Nothing to do — don't churn history.
    if cur.rate_to_nok = p_rate
       and (p_name is null or p_name = cur.name)
       and (p_symbol is null or p_symbol = cur.symbol)
       and (p_symbol_before is null or p_symbol_before = cur.symbol_before) then
      return;
    end if;
    -- Close the current version, then open a new one (metadata carried forward).
    update memoir_currencies set __end_at = now() where id = cur.id;
    insert into memoir_currencies (code, name, symbol, symbol_before, rate_to_nok)
    values (
      p_code,
      coalesce(p_name, cur.name),
      coalesce(p_symbol, cur.symbol),
      coalesce(p_symbol_before, cur.symbol_before),
      p_rate
    );
  else
    -- First time we've seen this currency: name + symbol are required.
    if p_name is null or p_symbol is null then
      raise exception 'New currency % needs a name and symbol on first insert', p_code;
    end if;
    insert into memoir_currencies (code, name, symbol, symbol_before, rate_to_nok)
    values (p_code, p_name, p_symbol, coalesce(p_symbol_before, false), p_rate);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Seed the three currencies the app ships with. NOK is the base (rate = 1).
-- The EUR/USD rates are starting placeholders — update them with real numbers
-- using memoir_set_currency_rate (see supabase/CURRENCIES.md). Safe to re-run:
-- on conflict with the "one open row per code" index, the insert is skipped.
-- ---------------------------------------------------------------------------
insert into memoir_currencies (code, name, symbol, symbol_before, rate_to_nok) values
  ('NOK', 'Norwegian krone', 'kr', false, 1.000000),
  ('EUR', 'Euro',            '€',  true,  11.500000),
  ('USD', 'US dollar',       '$',  true,  10.500000)
on conflict do nothing;
