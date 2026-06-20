# CLAUDE.md

Guidance for Claude Code (and any AI assistant) working in this repository.

## Project

**Memoir** is a reusable personal experience database (React + Vite + TypeScript +
Tailwind, backed by Supabase). Users track food, alcohol, activities, and purchases
inside projects. See [`README.md`](README.md) for the full overview and stack.

## Versioning & changelog — ALWAYS keep these updated

Every change that ships **must** bump the version and add a [`CHANGELOG.md`](CHANGELOG.md)
entry. This is mandatory, not optional.

This project uses Semantic Versioning (`MAJOR.MINOR.PATCH`). Decide the bump by the
nature of the change:

| Bump        | When                                              | Examples                                              |
| ----------- | ------------------------------------------------- | ----------------------------------------------------- |
| **MAJOR**   | A brand-new feature is added                      | A new page, a new entry type, a new integration       |
| **MINOR**   | An existing feature is changed                    | Reworking how the stats page calculates, new options  |
| **PATCH**   | Minor UI/UX fixes and polish (no feature changes) | Spacing, positioning, scrolling fixes, copy tweaks    |

If a single change set mixes categories, use the **highest** applicable bump (a new
feature that also tweaks UI is a MAJOR bump).

### What to do on every change

1. **Update [`VERSION.md`](VERSION.md)** — it contains only the version string (e.g.
   `1.0.1`). Bump it according to the table above.
2. **Add a [`CHANGELOG.md`](CHANGELOG.md) entry** — add a new `## [x.y.z] - YYYY-MM-DD`
   section at the top (most recent first), grouped into `Added` / `Changed` / `Fixed`
   as appropriate. Write entries from the user's perspective, in plain language.
3. **Keep them in sync** — `VERSION.md`, the latest `CHANGELOG.md` heading, and the
   version shown in the app must always match.

The in-app **Settings** screen reads `VERSION.md` and displays the version at the
bottom, so updating `VERSION.md` automatically updates what users see. Do not hardcode
the version anywhere else.

## Testing & verification

Before signing off on a change, test it in the running app whenever it's observable in
the browser — **all** new features, and UI/UX changes when verification adds confidence
(layout, scrolling, positioning, interactive behavior).

There is a dedicated test account you can use to log in and exercise the app. The
credentials live in the (gitignored) [`.env`](.env) file as `TEST_ACCOUNT_EMAIL` and
`TEST_ACCOUNT_PASSWORD` — read them from there rather than hardcoding them.

Workflow: start the dev server (`npm run dev`), sign in with the test account from
`.env`, navigate to the affected screen, and confirm the change behaves as intended
(and that there are no console errors) before reporting the work as done. Use the test
account only for verifying your own changes.

## Conventions

- Match the style, naming, and structure of the surrounding code.
- TypeScript is strict with `noUnusedLocals` / `noUnusedParameters` — remove unused
  imports. Run `npx tsc -b` to type-check before considering work done.
- All Supabase tables are prefixed `memoir_` and protected by RLS.
