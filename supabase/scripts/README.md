# Manual scripts

One-off, **manually-run** SQL utilities. These are **not** migrations and must
never run automatically as part of deploy or CI.

- **`drop_all_tables.sql`** — ⚠️ **destructive.** Drops every `memoir_` table and
  all its data. Only for wiping a throwaway/local database. Never run against
  production.

Schema changes belong in [`../migrations/`](../migrations); reproducible sample data
belongs in [`../seeds/`](../seeds).
