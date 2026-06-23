# Updating currency prices (exchange rates)

Memoir keeps a small **shared currency reference table**, `memoir_currencies`, that
backs the currency picker shown when you create a project. It ships with **NOK**,
**EUR**, and **USD**. NOK is the base currency, so its rate is always `1`; every other
currency's rate is **how many NOK equal 1 unit of that currency**.

The app only ever *reads* this table. You keep the rates current by running a little
SQL **by hand** — there is no button in the app for it, on purpose. This page is the
how-to.

## How the history works (SCD2)

Every rate a currency has ever had is kept as its own row. A row is the **current**
rate while its `__end_at` is `NULL`. When you set a new rate, the old row is *closed*
(its `__end_at` gets a timestamp) and a fresh open row is inserted. So:

- **"What's the rate right now?"** → the row where `__end_at IS NULL`.
- **"What was it last month?"** → the row whose `[__start_at, __end_at)` window covers
  that date.

Nothing is ever overwritten or deleted, so the full price history stays queryable.

## One-time setup

If you haven't already, run [`migrations/0002_currencies.sql`](migrations/0002_currencies.sql)
once in the **Supabase dashboard → SQL Editor**. That creates the table, the helper
function, and seeds NOK/EUR/USD with starting placeholder rates.

## Updating a rate (the normal case)

In **Supabase → SQL Editor**, call the helper with the currency code and the new rate:

```sql
-- EUR is now 11.62 NOK
select memoir_set_currency_rate('EUR', 11.62);

-- USD is now 10.73 NOK
select memoir_set_currency_rate('USD', 10.73);
```

That's it. The function closes the old row and opens a new one for you. Re-running it
with the **same** rate is a no-op, so you won't pile up duplicate history.

> Don't update `NOK` — it's the base currency and must stay at `1`.

## Adding a brand-new currency

The first time you mention a currency, also pass its name and symbol. The last argument
says whether the symbol goes **before** the amount (`true` → `£10`) or after it
(`false` → `10 kr`):

```sql
-- British pound at 13.40 NOK, symbol before the amount
select memoir_set_currency_rate('GBP', 13.40, 'British pound', '£', true);
```

After that, update it the short way like any other currency:

```sql
select memoir_set_currency_rate('GBP', 13.55);
```

> The picker will immediately offer any currency you add here. Note that the app's
> money **formatting** (the symbol shown next to costs) currently has built-in styling
> for NOK, EUR, and USD only; a new code is still stored and selectable, but shows the
> bare number until formatting support is added for it.

## Doing it by hand (without the helper)

The helper just wraps these two statements in the SCD2 pattern — close the open row,
then insert a new one:

```sql
-- 1) close the current EUR rate
update memoir_currencies
   set __end_at = now()
 where code = 'EUR' and __end_at is null;

-- 2) open the new EUR rate
insert into memoir_currencies (code, name, symbol, symbol_before, rate_to_nok)
values ('EUR', 'Euro', '€', true, 11.62);
```

## Checking your work

```sql
-- current rates only (this is what the app reads)
select code, name, symbol, rate_to_nok from memoir_currencies_current order by code;

-- full history for one currency, newest first
select code, rate_to_nok, __start_at, __end_at
  from memoir_currencies
 where code = 'EUR'
 order by __start_at desc;
```
