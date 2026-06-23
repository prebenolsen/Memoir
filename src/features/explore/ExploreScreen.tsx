import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { MapPin, User, Users, Store, Wine, Compass } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Card, SectionTitle } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { RatingBadge } from '@/components/ui/RatingInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Sheet } from '@/components/ui/Sheet';
import { toast } from '@/components/ui/Toast';
import { ItemListView } from '@/features/items/ItemListView';
import { useProject } from '@/context/ProjectProvider';
import { useItemList, type ItemWithStats } from '@/hooks/useItems';
import { useLatestEntries } from '@/hooks/useLatestEntries';
import { useFriendFavorites, useFriendDrinkFavorites } from '@/hooks/useFriendFavorites';
import { getCurrentPosition, distanceMeters, type Coords, GeoError } from '@/lib/geo';
import { formatDate } from '@/lib/format';
import type { RatingScale } from '@/types/db';

type ExploreKind = 'restaurant' | 'drink';
type Category = 'all' | ExploreKind;
type Mode = 'nearby' | 'mine' | 'friends';

const NEARBY_RADIUS_M = 5_000;

const KIND_META: Record<ExploreKind, { label: string; icon: LucideIcon; countLabel: (n: number) => string }> = {
  restaurant: { label: 'Restaurants', icon: Store, countLabel: (n) => `${n} visit${n === 1 ? '' : 's'}` },
  drink: { label: 'Beverages', icon: Wine, countLabel: (n) => `${n}× consumed` },
};

const ORDER: ExploreKind[] = ['restaurant', 'drink'];

function formatDistance(m: number): string {
  return m < 1000 ? `${m} m` : `${(m / 1000).toFixed(1)} km`;
}

function topRated(items: ItemWithStats[], n: number): ItemWithStats[] {
  return [...items]
    .filter((i) => i.avg_rating != null)
    .sort((a, b) => (b.avg_rating ?? -1) - (a.avg_rating ?? -1) || b.count - a.count)
    .slice(0, n);
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-3 text-sm text-text-muted">{children}</p>;
}

/** Your 5 most recent occasions for a category. */
function LatestSection({ kind, scale }: { kind: ExploreKind; scale: RatingScale }) {
  const { data: latest = [], isLoading } = useLatestEntries(kind);
  return (
    <div>
      <SectionTitle>Your latest</SectionTitle>
      <Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : latest.length === 0 ? (
          <Empty>Nothing logged yet.</Empty>
        ) : (
          latest.map((e) => (
            <div key={e.id} className="border-t border-border first:border-t-0">
              <ListRow
                title={e.name}
                subtitle={formatDate(e.entry_date, 'YYYY-MM-DD')}
                right={<RatingBadge value={e.rating} scale={scale} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/** Your top-rated items, optionally limited to within 5 km of `coords`. */
function FavoritesSection({
  kind,
  scale,
  coords,
  onSeeAll,
}: {
  kind: ExploreKind;
  scale: RatingScale;
  coords: Coords | null;
  onSeeAll: () => void;
}) {
  const { data: items = [], isLoading } = useItemList(kind);

  const rows = useMemo(() => {
    let list = items;
    if (coords) {
      list = list.filter((i) => {
        const lat = i.extra?.latitude as number | null | undefined;
        const lon = i.extra?.longitude as number | null | undefined;
        if (lat == null || lon == null) return false;
        return distanceMeters(coords.latitude, coords.longitude, lat, lon) <= NEARBY_RADIUS_M;
      });
    }
    return topRated(list, 5).map((i) => {
      const lat = i.extra?.latitude as number | null | undefined;
      const lon = i.extra?.longitude as number | null | undefined;
      const dist =
        coords && lat != null && lon != null
          ? distanceMeters(coords.latitude, coords.longitude, lat, lon)
          : null;
      return { item: i, dist };
    });
  }, [items, coords]);

  return (
    <div>
      <SectionTitle
        action={
          <button onClick={onSeeAll} className="text-sm font-medium text-primary">
            See all
          </button>
        }
      >
        {coords ? 'My nearby favorites' : 'Your favorites'}
      </SectionTitle>
      <Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : rows.length === 0 ? (
          <Empty>{coords ? 'No rated places within 5 km.' : 'No rated items yet.'}</Empty>
        ) : (
          rows.map(({ item, dist }) => (
            <div key={item.id} className="border-t border-border first:border-t-0">
              <ListRow
                title={item.name}
                subtitle={
                  KIND_META[kind].countLabel(item.count) +
                  (dist != null ? ` · ${formatDistance(dist)}` : '')
                }
                right={<RatingBadge value={item.avg_rating} scale={scale} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/** Friends' top restaurants (aggregated), optionally limited to within 5 km. */
function FriendFavoritesSection({ scale, coords }: { scale: RatingScale; coords: Coords | null }) {
  const { data: favs = [], isLoading, isError } = useFriendFavorites();

  const rows = useMemo(() => {
    let list = favs;
    if (coords) {
      list = list.filter((f) => {
        if (f.latitude == null || f.longitude == null) return false;
        return (
          distanceMeters(coords.latitude, coords.longitude, f.latitude, f.longitude) <=
          NEARBY_RADIUS_M
        );
      });
    }
    return list.slice(0, 10).map((f) => {
      const dist =
        coords && f.latitude != null && f.longitude != null
          ? distanceMeters(coords.latitude, coords.longitude, f.latitude, f.longitude)
          : null;
      return { fav: f, dist };
    });
  }, [favs, coords]);

  return (
    <div>
      <SectionTitle>Friends' favorites</SectionTitle>
      <Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : isError ? (
          <Empty>Friend favorites aren't available yet.</Empty>
        ) : rows.length === 0 ? (
          <Empty>
            {coords ? "No friends' places within 5 km." : 'Add friends to see their favorites.'}
          </Empty>
        ) : (
          rows.map(({ fav, dist }) => (
            <div key={fav.restaurant_id} className="border-t border-border first:border-t-0">
              <ListRow
                title={fav.name}
                subtitle={
                  `@${fav.friend_username ?? 'friend'}` +
                  (dist != null ? ` · ${formatDistance(dist)}` : '')
                }
                right={<RatingBadge value={fav.avg_rating} scale={scale} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/** Friends' top beverages (aggregated). Beverages have no location. */
function FriendDrinkFavoritesSection({ scale }: { scale: RatingScale }) {
  const { data: favs = [], isLoading, isError } = useFriendDrinkFavorites();
  const rows = useMemo(() => favs.slice(0, 10), [favs]);

  return (
    <div>
      <SectionTitle>Friends' favorites</SectionTitle>
      <Card>
        {isLoading ? (
          <Empty>Loading…</Empty>
        ) : isError ? (
          <Empty>Friend favorites aren't available yet.</Empty>
        ) : rows.length === 0 ? (
          <Empty>Add friends to see their favorites.</Empty>
        ) : (
          rows.map((fav) => (
            <div key={fav.drink_id} className="border-t border-border first:border-t-0">
              <ListRow
                title={fav.name}
                subtitle={`@${fav.friend_username ?? 'friend'}`}
                right={<RatingBadge value={fav.avg_rating} scale={scale} />}
              />
            </div>
          ))
        )}
      </Card>
    </div>
  );
}

/** All the blocks shown for one category, depending on the active mode. */
function CategorySection({
  kind,
  mode,
  coords,
  scale,
  onSeeAll,
}: {
  kind: ExploreKind;
  mode: Mode;
  coords: Coords | null;
  scale: RatingScale;
  onSeeAll: (kind: ExploreKind) => void;
}) {
  const { icon: Icon, label } = KIND_META[kind];
  const isRestaurant = kind === 'restaurant';

  return (
    <section className="space-y-4">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold text-primary">
        <Icon size={20} /> {label}
      </h2>

      {mode === 'friends' ? (
        isRestaurant ? (
          <FriendFavoritesSection scale={scale} coords={null} />
        ) : (
          <FriendDrinkFavoritesSection scale={scale} />
        )
      ) : mode === 'nearby' ? (
        isRestaurant ? (
          <>
            <FavoritesSection kind={kind} scale={scale} coords={coords} onSeeAll={() => onSeeAll(kind)} />
            <FriendFavoritesSection scale={scale} coords={coords} />
          </>
        ) : (
          <>
            <Empty>Location filtering only applies to restaurants — showing all of yours.</Empty>
            <LatestSection kind={kind} scale={scale} />
            <FavoritesSection kind={kind} scale={scale} coords={null} onSeeAll={() => onSeeAll(kind)} />
          </>
        )
      ) : (
        <>
          <LatestSection kind={kind} scale={scale} />
          <FavoritesSection kind={kind} scale={scale} coords={null} onSeeAll={() => onSeeAll(kind)} />
        </>
      )}
    </section>
  );
}

export function ExploreScreen() {
  const { settings } = useProject();
  const scale = settings.rating_scale;
  const [category, setCategory] = useState<Category>('all');
  const [mode, setMode] = useState<Mode>('nearby');
  const [coords, setCoords] = useState<Coords | null>(null);
  const [seeAll, setSeeAll] = useState<ExploreKind | null>(null);

  // Resolve the device location the first time "Nearby" is active; fall back to
  // "Mine" with a toast if the user denies or location is unavailable.
  useEffect(() => {
    if (mode !== 'nearby' || coords) return;
    let active = true;
    getCurrentPosition()
      .then((c) => active && setCoords(c))
      .catch((e: unknown) => {
        if (!active) return;
        toast(e instanceof GeoError ? e.message : 'Could not get your location.', 'error');
        setMode('mine');
      });
    return () => {
      active = false;
    };
  }, [mode, coords]);

  const nearbyCoords = mode === 'nearby' ? coords : null;
  const kinds: ExploreKind[] = category === 'all' ? ORDER : [category];

  const modeOptions: { value: Mode; label: string; icon: LucideIcon }[] = [
    { value: 'nearby', label: 'Nearby', icon: MapPin },
    { value: 'mine', label: 'Mine', icon: User },
    { value: 'friends', label: 'Friends', icon: Users },
  ];

  return (
    <div className="space-y-4">
      <SegmentedControl<Category>
        value={category}
        onChange={setCategory}
        options={[
          { value: 'all', label: 'All' },
          { value: 'restaurant', label: 'Restaurants' },
          { value: 'drink', label: 'Beverages' },
        ]}
      />

      <div className="flex gap-2">
        {modeOptions.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setMode(value)}
            className={
              'flex flex-1 items-center justify-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition ' +
              (mode === value ? 'bg-primary text-primary-fg' : 'bg-surface-alt text-text-muted')
            }
          >
            <Icon size={15} />
            {label}
          </button>
        ))}
      </div>

      {mode === 'nearby' && !coords ? (
        <EmptyState icon={Compass} title="Finding places near you…" subtitle="Allow location to see what's good nearby." />
      ) : (
        <div className="space-y-8">
          {kinds.map((kind) => (
            <CategorySection
              key={kind}
              kind={kind}
              mode={mode}
              coords={nearbyCoords}
              scale={scale}
              onSeeAll={setSeeAll}
            />
          ))}
        </div>
      )}

      <Sheet open={seeAll != null} onClose={() => setSeeAll(null)} title={seeAll ? KIND_META[seeAll].label : ''}>
        {seeAll && (
          <ItemListView
            kind={seeAll}
            emptyIcon={KIND_META[seeAll].icon}
            emptyText={`Items you log are saved here with your counts and average rating.`}
            countLabel={KIND_META[seeAll].countLabel}
          />
        )}
      </Sheet>
    </div>
  );
}
