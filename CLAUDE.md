# CLAUDE.md

Guidance for any AI assistant working in this repository.

## Project

**Memoir** is a reusable personal experience database: users track food, alcohol,
activities, and purchases inside projects. React + Vite + TypeScript + Tailwind,
backed by Supabase. See [`README.md`](README.md) for the full stack.

## Where things live

- **Features** — `src/features/<feature>/`. Each feature owns its components, business
  logic, and its data hooks in `src/features/<feature>/hooks/`. Cross-feature imports
  use the `@/features/…` alias.
- **`src/hooks/`** — truly app-wide hooks only (`useItems`, `useFriends`,
  `useCurrencies`, `useConfirmDelete`). A hook owned by one feature belongs in that
  feature's `hooks/` folder.
- **`src/components/ui/`** — generic, reusable UI primitives only. Feature-specific
  components stay with their feature; layout chrome lives in `src/components/layout/`.
- **`src/context/`** — true global providers only (auth, project selection, settings).
  For server/application data use React Query hooks, not new context providers.
- **`src/lib/`** — shared utilities (`format.ts`, `supabase.ts`, etc.). **`src/types/db.ts`**
  is the source of truth for DB types. Routing is in `src/App.tsx`.
- **The Journal feature** (`src/features/journal/`, route `#/journal`) is the day view —
  formerly "Today". Use the **Journal** name in new code. `logicalToday()` / `todayISO()`
  in `lib/format.ts` are the actual calendar day, unrelated to the feature name.
- **Supabase** — schema changes in `supabase/migrations/`, sample data in
  `supabase/seeds/`, one-off/destructive utilities in `supabase/scripts/`. Never put a
  destructive script in `migrations/`.

## Conventions

- Match the style, naming, and structure of the surrounding code.
- TypeScript is strict (`noUnusedLocals` / `noUnusedParameters`) — remove unused
  imports and run `npx tsc -b` before considering work done.
- All Supabase tables are prefixed `memoir_` and protected by RLS.

## Versioning & changelog — mandatory on every change

Every shipped change **must** bump the version and add a [`CHANGELOG.md`](CHANGELOG.md)
entry. Steps:

1. **Bump [`VERSION.md`](VERSION.md)** (it holds only the version string) using
   Semantic Versioning:

   | Bump      | When                                          |
   | --------- | --------------------------------------------- |
   | **MAJOR** | A brand-new feature (page, entry type, integration) |
   | **MINOR** | An existing feature is changed                |
   | **PATCH** | UI/UX fixes and polish, no feature change     |

   A mixed change set uses the **highest** applicable bump.

2. **Add a `## [x.y.z] - YYYY-MM-DD` entry** at the top of `CHANGELOG.md`, grouped into
   `Added` / `Changed` / `Fixed`, written from the user's perspective in plain language.

3. **Keep in sync** — `VERSION.md`, the latest `CHANGELOG.md` heading, and the version
   shown in-app must match. The in-app **Profile** screen reads `VERSION.md`; never
   hardcode the version elsewhere.

## Testing & verification

Verify changes in the running app whenever they're observable in the browser — all new
features, and UI/UX changes where it adds confidence (layout, scrolling, interaction).

Workflow: `npm run dev`, sign in with the test account, navigate to the affected screen,
and confirm the behavior and that there are no console errors before reporting done. The
test account credentials are in the gitignored [`.env`](.env) (`TEST_ACCOUNT_EMAIL` /
`TEST_ACCOUNT_PASSWORD`) — read them from there, don't hardcode. Use the test account
only for verifying your own changes.
