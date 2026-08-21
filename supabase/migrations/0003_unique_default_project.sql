-- ============================================================================
-- Prevent more than one default project per user.
--
-- AuthProvider's bootstrapUser() checks "does this user have a project?" and
-- inserts a default "Everyday Life" project if not — but getSession() and
-- onAuthStateChange's initial event both run this check-then-insert on every
-- load, so the two calls can race: both see zero projects before either
-- insert commits, and both insert. This constraint makes the second insert
-- fail instead of silently creating a duplicate default project.
-- ============================================================================
create unique index if not exists memoir_projects_default_uniq
  on memoir_projects (user_id)
  where is_default;
