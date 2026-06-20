-- ============================================================================
-- Memoir — initial schema
-- Personal experience database. Entries are history; items are reusable.
--
-- Conventions for every table:
--   id          uuid primary key default gen_random_uuid()
--   user_id     uuid not null default auth.uid() references auth.users(id)
--   created_at  timestamptz not null default now()
--
-- RLS is enabled on every table with a single owner-only policy
-- (auth.uid() = user_id) covering select/insert/update/delete.
--
-- Registration is disabled in the app; users are added manually in Supabase.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type memoir_meal_type as enum ('breakfast', 'lunch', 'dinner');
exception when duplicate_object then null; end $$;

do $$ begin
  create type memoir_food_source as enum ('home', 'restaurant', 'cafe');
exception when duplicate_object then null; end $$;

do $$ begin
  create type memoir_drink_type as enum ('beer', 'wine', 'cocktail', 'spirit', 'other');
exception when duplicate_object then null; end $$;

do $$ begin
  create type memoir_purchase_category as enum ('clothes', 'souvenir', 'electronics', 'other');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Helper: apply the standard owner-only RLS policy to a table
-- ---------------------------------------------------------------------------
create or replace function memoir_apply_owner_rls(tbl regclass)
returns void language plpgsql as $$
declare
  pol_name text := 'owner_all';
begin
  execute format('alter table %s enable row level security', tbl);
  execute format('alter table %s force row level security', tbl);
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = (select relname from pg_class where oid = tbl)
      and policyname = pol_name
  ) then
    execute format(
      'create policy %I on %s for all to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id)',
      pol_name, tbl
    );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- Reusable item tables (personal databases)
-- ---------------------------------------------------------------------------
create table if not exists memoir_food_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  default_rating int check (default_rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists memoir_food_items_uniq on memoir_food_items (user_id, lower(name));

create table if not exists memoir_restaurants (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  source memoir_food_source,
  default_rating int check (default_rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists memoir_restaurants_uniq on memoir_restaurants (user_id, lower(name));

create table if not exists memoir_drink_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  drink_type memoir_drink_type not null default 'other',
  default_rating int check (default_rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists memoir_drink_items_uniq on memoir_drink_items (user_id, lower(name));

create table if not exists memoir_activity_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  default_rating int check (default_rating between 1 and 10),
  notes text,
  created_at timestamptz not null default now()
);
create unique index if not exists memoir_activity_items_uniq on memoir_activity_items (user_id, lower(name));

-- ---------------------------------------------------------------------------
-- Projects & settings
-- ---------------------------------------------------------------------------
create table if not exists memoir_projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name text not null,
  start_date date,
  end_date date,
  is_default boolean not null default false,
  settings_override jsonb,
  created_at timestamptz not null default now()
);
create index if not exists memoir_projects_user_idx on memoir_projects (user_id);

create table if not exists memoir_settings (
  user_id uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  date_format text not null default 'DD.MM.YYYY',
  currency text not null default 'NOK',
  rating_scale int not null default 10 check (rating_scale in (5, 10)),
  first_day_of_week text not null default 'monday',
  theme text not null default 'system',
  remember_last_project boolean not null default true,
  remember_last_date boolean not null default true,
  confirm_before_delete boolean not null default true,
  last_project_id uuid references memoir_projects(id) on delete set null,
  last_date date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Entry tables (history)
-- ---------------------------------------------------------------------------
create table if not exists memoir_food_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  meal_type memoir_meal_type not null,
  source memoir_food_source not null default 'home',
  food_item_id uuid references memoir_food_items(id) on delete set null,
  restaurant_id uuid references memoir_restaurants(id) on delete set null,
  starter text,
  main_course text,
  dessert text,
  rating int check (rating between 1 and 10),
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists memoir_food_entries_day_idx on memoir_food_entries (user_id, project_id, entry_date);
create index if not exists memoir_food_entries_item_idx on memoir_food_entries (food_item_id);
create index if not exists memoir_food_entries_rest_idx on memoir_food_entries (restaurant_id);

create table if not exists memoir_drink_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  drink_item_id uuid references memoir_drink_items(id) on delete set null,
  drink_type memoir_drink_type not null default 'other',
  count_05l int not null default 0,
  count_033l int not null default 0,
  quantity int not null default 1,
  rating int check (rating between 1 and 10),
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists memoir_drink_entries_day_idx on memoir_drink_entries (user_id, project_id, entry_date);
create index if not exists memoir_drink_entries_item_idx on memoir_drink_entries (drink_item_id);

create table if not exists memoir_activity_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  activity_item_id uuid references memoir_activity_items(id) on delete set null,
  description text,
  rating int check (rating between 1 and 10),
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists memoir_activity_entries_day_idx on memoir_activity_entries (user_id, project_id, entry_date);
create index if not exists memoir_activity_entries_item_idx on memoir_activity_entries (activity_item_id);

create table if not exists memoir_purchase_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  item_name text not null,
  category memoir_purchase_category not null default 'other',
  cost numeric(12, 2),
  notes text,
  created_at timestamptz not null default now()
);
create index if not exists memoir_purchase_entries_day_idx on memoir_purchase_entries (user_id, project_id, entry_date);

-- ---------------------------------------------------------------------------
-- Enable RLS + owner policy on every table
-- ---------------------------------------------------------------------------
select memoir_apply_owner_rls('memoir_food_items');
select memoir_apply_owner_rls('memoir_restaurants');
select memoir_apply_owner_rls('memoir_drink_items');
select memoir_apply_owner_rls('memoir_activity_items');
select memoir_apply_owner_rls('memoir_projects');
select memoir_apply_owner_rls('memoir_settings');
select memoir_apply_owner_rls('memoir_food_entries');
select memoir_apply_owner_rls('memoir_drink_entries');
select memoir_apply_owner_rls('memoir_activity_entries');
select memoir_apply_owner_rls('memoir_purchase_entries');

-- ---------------------------------------------------------------------------
-- Stat views (derive counts/averages — no counter columns to drift).
-- Views run with the querying user's privileges (security_invoker) so the
-- underlying tables' RLS governs row visibility.
-- avg_rating combines per-occasion entry ratings with the item's
-- default_rating as a fallback when no occasion was rated.
-- ---------------------------------------------------------------------------
create or replace view memoir_food_item_stats
with (security_invoker = true) as
select
  fi.id as food_item_id,
  fi.user_id,
  count(fe.id) as times_eaten,
  coalesce(avg(fe.rating), fi.default_rating) as avg_rating
from memoir_food_items fi
left join memoir_food_entries fe on fe.food_item_id = fi.id
group by fi.id, fi.user_id, fi.default_rating;

create or replace view memoir_restaurant_stats
with (security_invoker = true) as
select
  r.id as restaurant_id,
  r.user_id,
  count(fe.id) as visits,
  coalesce(avg(fe.rating), r.default_rating) as avg_rating
from memoir_restaurants r
left join memoir_food_entries fe on fe.restaurant_id = r.id
group by r.id, r.user_id, r.default_rating;

create or replace view memoir_drink_item_stats
with (security_invoker = true) as
select
  di.id as drink_item_id,
  di.user_id,
  count(de.id) as times_consumed,
  coalesce(sum(de.count_05l), 0) as total_05l,
  coalesce(sum(de.count_033l), 0) as total_033l,
  coalesce(sum(de.quantity), 0) as total_qty,
  coalesce(avg(de.rating), di.default_rating) as avg_rating
from memoir_drink_items di
left join memoir_drink_entries de on de.drink_item_id = di.id
group by di.id, di.user_id, di.default_rating;

create or replace view memoir_activity_item_stats
with (security_invoker = true) as
select
  ai.id as activity_item_id,
  ai.user_id,
  count(ae.id) as times_done,
  coalesce(avg(ae.rating), ai.default_rating) as avg_rating
from memoir_activity_items ai
left join memoir_activity_entries ae on ae.activity_item_id = ai.id
group by ai.id, ai.user_id, ai.default_rating;
