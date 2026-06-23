-- ============================================================================
-- Memoir — friends' beverage favorites RPC
--
-- Mirrors memoir_friend_restaurant_favorites (see 0001_init.sql) so that the
-- Explore page's "Friends" tab can show friends' favorite drinks alongside their
-- restaurants. Security-definer so it can read friends' rows, but constrained to
-- accepted friends of auth.uid(); only aggregates are returned, never raw
-- entries.
--
-- Run this file once on top of 0001_init.sql (and 0002_currencies.sql).
-- ============================================================================

create or replace function memoir_friend_drink_favorites()
returns table (
  friend_id       uuid,
  friend_username text,
  drink_id        uuid,
  name            text,
  drink_type      text,
  avg_rating      numeric,
  count           bigint
)
language sql
stable
security definer
set search_path = public
as $$
  select
    d.user_id as friend_id,
    p.username as friend_username,
    d.id as drink_id,
    d.name,
    d.drink_type::text as drink_type,
    coalesce(avg(de.rating), d.default_rating) as avg_rating,
    count(de.id) as count
  from memoir_friendships f
  join memoir_drink_items d
    on d.user_id = case when f.requester_id = auth.uid() then f.addressee_id else f.requester_id end
  left join memoir_drink_entries de on de.drink_item_id = d.id
  left join memoir_profiles p on p.user_id = d.user_id
  where f.status = 'accepted'
    and (f.requester_id = auth.uid() or f.addressee_id = auth.uid())
  group by d.user_id, p.username, d.id, d.name, d.drink_type, d.default_rating;
$$;
grant execute on function memoir_friend_drink_favorites() to authenticated;
