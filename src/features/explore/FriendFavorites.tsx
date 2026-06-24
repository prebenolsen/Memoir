import { useMemo } from 'react';
import { Store, Wine, Users, ChevronRight } from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { RatingBadge } from '@/components/ui/RatingInput';
import { Sheet } from '@/components/ui/Sheet';
import { useFriendFavorites, useFriendDrinkFavorites } from '@/features/explore/hooks/useFriendFavorites';
import type { RatingScale } from '@/types/db';

/** Minimal shape needed to identify and label a friend. */
export interface FriendRef {
  userId: string;
  username: string | null;
  email: string | null;
}

/** "@username", login email, or a generic fallback. */
export function friendLabel(f: FriendRef): string {
  return f.username ? `@${f.username}` : f.email ?? 'friend';
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-4 py-3 text-sm text-text-muted">{children}</p>;
}

/** A pill-shaped friend picker shown on top of the Friends view. */
export function FriendsStrip({
  friends,
  onPick,
  onSeeAll,
}: {
  friends: FriendRef[];
  onPick: (f: FriendRef) => void;
  onSeeAll: () => void;
}) {
  if (friends.length === 0) return null;
  const pill =
    'inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition active:scale-[0.98]';
  return (
    <div className="flex flex-wrap gap-2">
      {friends.slice(0, 3).map((f) => (
        <button
          key={f.userId}
          onClick={() => onPick(f)}
          className={`${pill} bg-surface-alt text-text`}
        >
          <Users size={14} className="text-primary" />
          <span className="max-w-[10rem] truncate">{friendLabel(f)}</span>
        </button>
      ))}
      {friends.length > 3 && (
        <button onClick={onSeeAll} className={`${pill} border border-border text-primary`}>
          See all friends
        </button>
      )}
    </div>
  );
}

/** The full friend list as a picker, for finding someone beyond the top three. */
export function AllFriendsSheet({
  open,
  friends,
  onClose,
  onPick,
}: {
  open: boolean;
  friends: FriendRef[];
  onClose: () => void;
  onPick: (f: FriendRef) => void;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Friends">
      <Card>
        {friends.length === 0 ? (
          <p className="px-4 py-6 text-center text-sm text-text-muted">No friends yet.</p>
        ) : (
          friends.map((f) => (
            <button
              key={f.userId}
              onClick={() => onPick(f)}
              className="flex w-full items-center justify-between gap-2 border-t border-border px-4 py-3 text-left first:border-t-0"
            >
              <span className="truncate text-[15px]">{friendLabel(f)}</span>
              <ChevronRight size={16} className="shrink-0 text-text-muted" />
            </button>
          ))
        )}
      </Card>
    </Sheet>
  );
}

/** One friend's shared venue and beverage favorites, with their ratings. */
export function FriendDetailSheet({
  friend,
  scale,
  onClose,
}: {
  friend: FriendRef | null;
  scale: RatingScale;
  onClose: () => void;
}) {
  const { data: venues = [], isLoading: vLoading, isError: vError } = useFriendFavorites();
  const { data: drinks = [], isLoading: dLoading, isError: dError } = useFriendDrinkFavorites();

  const myVenues = useMemo(
    () => (friend ? venues.filter((v) => v.friend_id === friend.userId) : []),
    [venues, friend],
  );
  const myDrinks = useMemo(
    () => (friend ? drinks.filter((d) => d.friend_id === friend.userId) : []),
    [drinks, friend],
  );

  return (
    <Sheet open={friend != null} onClose={onClose} title={friend ? friendLabel(friend) : ''}>
      {friend && (
        <div className="space-y-5">
          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Store size={15} /> Venues
            </p>
            <Card>
              {vLoading ? (
                <Empty>Loading…</Empty>
              ) : vError ? (
                <Empty>Couldn't load this friend's venues.</Empty>
              ) : myVenues.length === 0 ? (
                <Empty>No venues shared yet.</Empty>
              ) : (
                myVenues.map((v) => (
                  <div key={v.venue_id} className="border-t border-border first:border-t-0">
                    <ListRow
                      title={v.name}
                      subtitle={`${v.visits} visit${v.visits === 1 ? '' : 's'}`}
                      right={<RatingBadge value={v.avg_rating} scale={scale} />}
                    />
                  </div>
                ))
              )}
            </Card>
          </div>

          <div>
            <p className="mb-1.5 flex items-center gap-1.5 text-sm font-semibold text-primary">
              <Wine size={15} /> Beverages
            </p>
            <Card>
              {dLoading ? (
                <Empty>Loading…</Empty>
              ) : dError ? (
                <Empty>Couldn't load this friend's beverages.</Empty>
              ) : myDrinks.length === 0 ? (
                <Empty>No beverages shared yet.</Empty>
              ) : (
                myDrinks.map((d) => (
                  <div key={d.drink_id} className="border-t border-border first:border-t-0">
                    <ListRow
                      title={d.name}
                      subtitle={`${d.count}× consumed`}
                      right={<RatingBadge value={d.avg_rating} scale={scale} />}
                    />
                  </div>
                ))
              )}
            </Card>
          </div>
        </div>
      )}
    </Sheet>
  );
}
