-- ============================================================================
-- Memoir — social layer: profiles (usernames) + friendships
--
-- Adds the ability to set a unique username, find friends by username or login
-- email, and see a friend's favorite restaurants. Friend favorites are exposed
-- only as server-side aggregates (name / location / rating / visits) — a
-- friend's raw entries (cost, notes, dishes) are never shared.
--
-- Conventions follow 0001_init.sql: case-insensitive uniqueness via a lower()
-- index, security_definer helpers with a pinned search_path, RLS forced on
-- every table. Policies are dropped-then-created so this file is re-runnable.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- Profiles — public handles. Holds no email/PII, so any authenticated user may
-- read it (needed so friends and pending requests resolve to a username).
-- ---------------------------------------------------------------------------
create table if not exists memoir_profiles (
  user_id    uuid primary key default auth.uid() references auth.users(id) on delete cascade,
  username   text,
  created_at timestamptz not null default now()
);
create unique index if not exists memoir_profiles_username_uniq
  on memoir_profiles (lower(username));

alter table memoir_profiles enable row level security;
alter table memoir_profiles force row level security;
grant select, insert, update, delete on memoir_profiles to authenticated;

drop policy if exists profiles_select on memoir_profiles;
create policy profiles_select on memoir_profiles
  for select to authenticated using (true);
drop policy if exists profiles_insert on memoir_profiles;
create policy profiles_insert on memoir_profiles
  for insert to authenticated with check (auth.uid() = user_id);
drop policy if exists profiles_update on memoir_profiles;
create policy profiles_update on memoir_profiles
  for update to authenticated using (auth.uid() = user_id) with check (auth.uid() = user_id);
drop policy if exists profiles_delete on memoir_profiles;
create policy profiles_delete on memoir_profiles
  for delete to authenticated using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Friendships — one row per relationship, request + accept.
-- ---------------------------------------------------------------------------
create table if not exists memoir_friendships (
  id           uuid primary key default gen_random_uuid(),
  requester_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  addressee_id uuid not null references auth.users(id) on delete cascade,
  status       text not null default 'pending' check (status in ('pending', 'accepted')),
  created_at   timestamptz not null default now(),
  responded_at timestamptz,
  check (requester_id <> addressee_id)
);
-- One relationship per pair, regardless of who sent the request.
create unique index if not exists memoir_friendships_pair_uniq
  on memoir_friendships (least(requester_id, addressee_id), greatest(requester_id, addressee_id));
create index if not exists memoir_friendships_addressee_idx
  on memoir_friendships (addressee_id);

alter table memoir_friendships enable row level security;
alter table memoir_friendships force row level security;
grant select, insert, update, delete on memoir_friendships to authenticated;

drop policy if exists friendships_select on memoir_friendships;
create policy friendships_select on memoir_friendships
  for select to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);
drop policy if exists friendships_insert on memoir_friendships;
create policy friendships_insert on memoir_friendships
  for insert to authenticated with check (auth.uid() = requester_id);
-- Only the addressee can accept/decline (update) a request.
drop policy if exists friendships_update on memoir_friendships;
create policy friendships_update on memoir_friendships
  for update to authenticated
  using (auth.uid() = addressee_id) with check (auth.uid() = addressee_id);
-- Either party can remove (unfriend) or cancel.
drop policy if exists friendships_delete on memoir_friendships;
create policy friendships_delete on memoir_friendships
  for delete to authenticated
  using (auth.uid() = requester_id or auth.uid() = addressee_id);

-- ---------------------------------------------------------------------------
-- Helper: are two users accepted friends?
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- Resolve a username OR a login email to (user_id, username). The email branch
-- reads auth.users server-side; the email itself is never returned to clients.
-- ---------------------------------------------------------------------------
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

-- ---------------------------------------------------------------------------
-- A caller's friends' restaurants, aggregated. Security-definer so it can read
-- friends' rows, but constrained to accepted friends of auth.uid(); only
-- aggregates are returned, never raw entries.
-- ---------------------------------------------------------------------------
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
