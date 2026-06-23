-- ============================================================================
-- Drink location: store city and country on drink entries so the user can
-- record where they were drinking (home, beach, a specific city abroad, etc.)
-- ============================================================================

alter table memoir_drink_entries
  add column if not exists city    text,
  add column if not exists country text;

-- ============================================================================
-- Account deletion RPC. SECURITY DEFINER so it can remove the row from
-- auth.users (which is not accessible to the authenticated role directly).
-- The cascade on auth.users takes care of all owned rows in public tables.
-- ============================================================================
create or replace function memoir_delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  delete from auth.users where id = auth.uid();
end;
$$;
grant execute on function memoir_delete_account() to authenticated;
