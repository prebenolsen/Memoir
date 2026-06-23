-- ============================================================================
-- Memoir — complete schema (fresh install, no prior tables assumed)
-- The single source of truth: enums, catalog/entry tables, projects/settings,
-- RLS, stat views, the social layer (profiles + friendships), and RPCs. Run
-- this one file to provision a database from scratch.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
create type memoir_meal_type     as enum ('breakfast', 'lunch', 'dinner');
create type memoir_food_source   as enum ('home', 'restaurant', 'cafe');
create type memoir_drink_type    as enum ('beer', 'wine', 'cocktail', 'spirit', 'other');
create type memoir_purchase_category as enum ('clothes', 'souvenir', 'electronics', 'other');

-- ---------------------------------------------------------------------------
-- Helper: apply the standard owner-only RLS policy to a table
-- ---------------------------------------------------------------------------
create or replace function memoir_apply_owner_rls(tbl regclass)
returns void language plpgsql as $$
declare pol_name text := 'owner_all';
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
-- Reusable item tables
-- ---------------------------------------------------------------------------
create table memoir_food_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  default_rating int  check (default_rating between 1 and 10),
  notes          text,
  created_at     timestamptz not null default now()
);
create unique index memoir_food_items_uniq on memoir_food_items (user_id, lower(name));

create table memoir_restaurants (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  source         memoir_food_source,
  default_rating int  check (default_rating between 1 and 10),
  notes          text,
  latitude       double precision,
  longitude      double precision,
  address        text,
  osm_id         text,
  created_at     timestamptz not null default now()
);
create unique index memoir_restaurants_uniq     on memoir_restaurants (user_id, lower(name));
create unique index memoir_restaurants_osm_uniq on memoir_restaurants (user_id, osm_id) where osm_id is not null;

create table memoir_drink_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  drink_type     memoir_drink_type not null default 'other',
  default_rating int  check (default_rating between 1 and 10),
  notes          text,
  created_at     timestamptz not null default now()
);
create unique index memoir_drink_items_uniq on memoir_drink_items (user_id, lower(name));

create table memoir_activity_items (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name           text not null,
  default_rating int  check (default_rating between 1 and 10),
  notes          text,
  created_at     timestamptz not null default now()
);
create unique index memoir_activity_items_uniq on memoir_activity_items (user_id, lower(name));

-- ---------------------------------------------------------------------------
-- Projects & settings
-- ---------------------------------------------------------------------------
create table memoir_projects (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null default auth.uid() references auth.users(id) on delete cascade,
  name              text not null,
  start_date        date,
  end_date          date,
  is_default        boolean not null default false,
  settings_override jsonb,
  created_at        timestamptz not null default now()
);
create index memoir_projects_user_idx on memoir_projects (user_id);

create table memoir_settings (
  user_id               uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  date_format           text    not null default 'DD.MM.YYYY',
  currency              text    not null default 'NOK',
  rating_scale          int     not null default 5 check (rating_scale in (5, 10)),
  first_day_of_week     text    not null default 'monday',
  theme                 text    not null default 'system',
  remember_last_project boolean not null default true,
  remember_last_date    boolean not null default true,
  confirm_before_delete boolean not null default true,
  last_project_id       uuid    references memoir_projects(id) on delete set null,
  last_date             date,
  created_at            timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Entry tables
-- ---------------------------------------------------------------------------
create table memoir_food_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id    uuid not null references memoir_projects(id) on delete cascade,
  entry_date    date not null,
  meal_type     memoir_meal_type not null,
  source        memoir_food_source not null default 'home',
  food_item_id  uuid references memoir_food_items(id) on delete set null,
  restaurant_id uuid references memoir_restaurants(id) on delete set null,
  starter       text,
  main_course   text,
  dessert       text,
  rating        int  check (rating between 1 and 10),
  cost          numeric(12, 2),
  notes         text,
  created_at    timestamptz not null default now()
);
create index memoir_food_entries_day_idx  on memoir_food_entries (user_id, project_id, entry_date);
create index memoir_food_entries_item_idx on memoir_food_entries (food_item_id);
create index memoir_food_entries_rest_idx on memoir_food_entries (restaurant_id);

create table memoir_drink_entries (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id    uuid not null references memoir_projects(id) on delete cascade,
  entry_date    date not null,
  drink_item_id uuid references memoir_drink_items(id) on delete set null,
  drink_type    memoir_drink_type not null default 'other',
  wine_style    text check (wine_style is null or wine_style in ('red', 'white', 'rose', 'sparkling')),
  abv           numeric(4, 1) check (abv is null or (abv >= 0 and abv <= 100)),
  count_033l    int not null default 0,
  count_04l     int not null default 0,
  count_05l     int not null default 0,
  count_0568l   int not null default 0,
  count_06l     int not null default 0,
  quantity      int not null default 1,
  rating        int check (rating between 1 and 10),
  cost          numeric(12, 2),
  notes         text,
  city          text,
  country       text,
  created_at    timestamptz not null default now()
);
create index memoir_drink_entries_day_idx  on memoir_drink_entries (user_id, project_id, entry_date);
create index memoir_drink_entries_item_idx on memoir_drink_entries (drink_item_id);

create table memoir_activity_entries (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id       uuid not null references memoir_projects(id) on delete cascade,
  entry_date       date not null,
  activity_item_id uuid references memoir_activity_items(id) on delete set null,
  description      text,
  rating           int  check (rating between 1 and 10),
  cost             numeric(12, 2),
  notes            text,
  created_at       timestamptz not null default now()
);
create index memoir_activity_entries_day_idx  on memoir_activity_entries (user_id, project_id, entry_date);
create index memoir_activity_entries_item_idx on memoir_activity_entries (activity_item_id);

create table memoir_purchase_entries (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null default auth.uid() references auth.users(id) on delete cascade,
  project_id uuid not null references memoir_projects(id) on delete cascade,
  entry_date date not null,
  item_name  text not null,
  category   memoir_purchase_category not null default 'other',
  cost       numeric(12, 2),
  notes      text,
  created_at timestamptz not null default now()
);
create index memoir_purchase_entries_day_idx on memoir_purchase_entries (user_id, project_id, entry_date);

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
-- Stat views (security_invoker so RLS governs visibility)
-- ---------------------------------------------------------------------------
create or replace view memoir_food_item_stats with (security_invoker = true) as
select fi.id as food_item_id, fi.user_id,
  count(fe.id) as times_eaten,
  coalesce(avg(fe.rating), fi.default_rating) as avg_rating
from memoir_food_items fi
left join memoir_food_entries fe on fe.food_item_id = fi.id
group by fi.id, fi.user_id, fi.default_rating;

create or replace view memoir_restaurant_stats with (security_invoker = true) as
select r.id as restaurant_id, r.user_id,
  count(fe.id) as visits,
  coalesce(avg(fe.rating), r.default_rating) as avg_rating
from memoir_restaurants r
left join memoir_food_entries fe on fe.restaurant_id = r.id
group by r.id, r.user_id, r.default_rating;

create or replace view memoir_drink_item_stats with (security_invoker = true) as
select di.id as drink_item_id, di.user_id,
  count(de.id) as times_consumed,
  coalesce(sum(de.count_05l), 0)  as total_05l,
  coalesce(sum(de.count_033l), 0) as total_033l,
  coalesce(sum(de.quantity), 0)   as total_qty,
  coalesce(avg(de.rating), di.default_rating) as avg_rating
from memoir_drink_items di
left join memoir_drink_entries de on de.drink_item_id = di.id
group by di.id, di.user_id, di.default_rating;

create or replace view memoir_activity_item_stats with (security_invoker = true) as
select ai.id as activity_item_id, ai.user_id,
  count(ae.id) as times_done,
  coalesce(avg(ae.rating), ai.default_rating) as avg_rating
from memoir_activity_items ai
left join memoir_activity_entries ae on ae.activity_item_id = ai.id
group by ai.id, ai.user_id, ai.default_rating;

-- ---------------------------------------------------------------------------
-- Social layer: profiles (usernames) + friendships
--
-- Lets a user set a unique username, find friends by username or login email,
-- and see a friend's favorite restaurants. Friend favorites are exposed only as
-- server-side aggregates (name / location / rating / visits) — a friend's raw
-- entries (cost, notes, dishes) are never shared.
--
-- These tables don't follow the owner-only helper: profiles are world-readable
-- (so handles resolve) and friendships need per-action policies, so RLS is set
-- up inline.
-- ---------------------------------------------------------------------------

-- Profiles — public handles. Holds no email/PII, so any authenticated user may
-- read it (needed so friends and pending requests resolve to a username).
create table memoir_profiles (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username   text,
  created_at timestamptz not null default now()
);
create unique index memoir_profiles_username_uniq on memoir_profiles (lower(username));

alter table memoir_profiles enable row level security;
alter table memoir_profiles force row level security;
grant select, insert, update, delete on memoir_profiles to authenticated;

create policy profiles_select on memoir_profiles
  for select to authenticated using (true);
create policy profiles_insert on memoir_profiles
  for insert to authenticated with check (auth.uid() = user_id);
create policy profiles_update on memoir_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy profiles_delete on memoir_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- Friendships — one row per relationship, request + accept.
create table memoir_friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- One relationship per pair, regardless of who sent the request.
create unique index memoir_friendships_pair_uniq
  on memoir_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index memoir_friendships_addressee_idx on memoir_friendships (addressee_id);

alter table memoir_friendships enable row level security;
alter table memoir_friendships force row level security;
grant select, insert, update, delete on memoir_friendships to authenticated;

create policy friendships_select on memoir_friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
create policy friendships_insert on memoir_friendships
  for insert to authenticated with check (auth.uid() = requester_id);
-- Only the addressee can accept/decline (update) a request.
create policy friendships_update on memoir_friendships
  for update to authenticated
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);
-- Either party can remove (unfriend) or cancel.
create policy friendships_delete on memoir_friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- Helper: are two users accepted friends?
create or replace function memoir_are_friends(a uuid, b uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from memoir_friendships
    where status = 'accepted'
      and ((requester_id = a and addressee_id = b)
        or (requester_id = b and addressee_id = a))
  );
$$;
grant execute on function memoir_are_friends(uuid, uuid) to authenticated;

-- Resolve a username OR a login email to (user_id, username). The email branch
-- reads auth.users server-side; the email itself is never returned to clients.
create or replace function memoir_find_profile(identifier text)
returns table (user_id uuid, username text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ident text := lower(trim(identifier));
begin
  return query
    select p.user_id, p.username
    from memoir_profiles p
    where lower(p.username) = ident
    limit 1;
  if found then
    return;
  end if;

  return query
    select u.id, p.username
    from auth.users u
    left join memoir_profiles p on p.user_id = u.id
    where lower(u.email) = ident
    limit 1;
end;
$$;
grant execute on function memoir_find_profile(text) to authenticated;

-- A caller's friends' restaurants, aggregated. Security-definer so it can read
-- friends' rows, but constrained to accepted friends of auth.uid(); only
-- aggregates are returned, never raw entries.
create or replace function memoir_friend_restaurant_favorites()
returns table (
  friend_id       uuid,
  friend_username text,
  restaurant_id   uuid,
  name            text,
  latitude        double precision,
  longitude       double precision,
  address         text,
  avg_rating      numeric,
  visits          bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.user_id as friend_id,
    p.username as friend_username,
    r.id as restaurant_id,
    r.name,
    r.latitude,
    r.longitude,
    r.address,
    coalesce(avg(fe.rating), r.default_rating) as avg_rating,
    count(fe.id) as visits
  from memoir_friendships f
  join memoir_restaurants r
    on r.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  left join memoir_food_entries fe on fe.restaurant_id = r.id
  left join memoir_profiles p on p.user_id = r.user_id
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  group by r.user_id, p.username, r.id, r.name, r.latitude, r.longitude, r.address, r.default_rating;
$$;
grant execute on function memoir_friend_restaurant_favorites() to authenticated;

-- ---------------------------------------------------------------------------
-- Account deletion RPC. SECURITY DEFINER so it can remove the row from
-- auth.users (not accessible to the authenticated role directly). The cascade
-- on auth.users takes care of all owned rows in the public tables above.
-- ---------------------------------------------------------------------------
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
