-- ============================================================================
-- Journal notes — freetext daily journal entries.
--
-- A plain, per-day journal: the user writes anything they like (feelings, what
-- they did, whether they hit the gym…) as pure text. Each note is its own row,
-- attached to a project and a calendar day. Strongly owned by the user and
-- never shared with friends (standard owner-only RLS, no friend RPCs). Later
-- this freetext is intended as raw material for AI analysis.
-- ============================================================================
create table memoir_journal_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  body       text not null,
  created_at timestamptz not null default now()
);
create index memoir_journal_entries_day_idx on memoir_journal_entries (user_id, project_id, entry_date);

select memoir_apply_owner_rls('memoir_journal_entries');
