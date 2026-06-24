import { useMemo, useState } from 'react';
import { Search, Database } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useItemList, type ItemKind, type ItemWithStats } from '@/hooks/useItems';
import { useProject } from '@/context/ProjectProvider';
import { Card } from '@/components/ui/Card';
import { ListRow } from '@/components/ui/ListRow';
import { RatingBadge } from '@/components/ui/RatingInput';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { titleCase } from '@/lib/format';
import { ItemDetailSheet } from './ItemDetailSheet';
import { BeverageThumb } from './BeverageThumb';
import type { RatingScale } from '@/types/db';

type SortKey = 'most' | 'rated' | 'name';

/**
 * For a venue, build a per-meal-type rating line when two or more meal types
 * have been rated — e.g. "Dinner ★4.5 · Lunch ★3.0". Returns null when a
 * flat visit count is more informative (only one meal type, or no ratings).
 */
function venueMealSubtitle(item: ItemWithStats, scale: RatingScale): string | null {
  const ms = item.extra?.meal_stats as
    | Record<string, { visits: number; avg_rating: number | null }>
    | undefined;
  if (!ms) return null;
  const order = ['dinner', 'lunch', 'breakfast', 'snack'] as const;
  const rated = order.filter((m) => ms[m]?.avg_rating != null);
  if (rated.length < 2) return null;
  return rated
    .map((m) => {
      const r = ms[m].avg_rating!;
      const display = scale === 5 ? Math.round(r / 2 * 2) / 2 : Math.round(r * 10) / 10;
      return `${titleCase(m)} ★${display}`;
    })
    .join(' · ');
}

export function ItemListView({
  kind,
  emptyIcon,
  emptyText,
  countLabel,
}: {
  kind: ItemKind;
  emptyIcon: LucideIcon;
  emptyText: string;
  countLabel: (n: number) => string;
}) {
  const { settings } = useProject();
  const { data: items = [], isLoading } = useItemList(kind);
  const [selected, setSelected] = useState<ItemWithStats | null>(null);
  const [query, setQuery] = useState('');
  const [sort, setSort] = useState<SortKey>('most');

  // Food, drink and venue items that have never been logged (0× consumed /
  // 0 visits) are hidden — only activities keep their un-logged rows, which the
  // user can remove explicitly from the detail sheet.
  const visibleItems = useMemo(
    () => (kind === 'activity' ? items : items.filter((i) => i.count > 0)),
    [items, kind],
  );

  const shown = useMemo(() => {
    let list = visibleItems;
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) => i.name.toLowerCase().includes(q));
    }
    return [...list].sort((a, b) => {
      if (sort === 'name') return a.name.localeCompare(b.name);
      if (sort === 'rated') return (b.avg_rating ?? -1) - (a.avg_rating ?? -1);
      return b.count - a.count;
    });
  }, [visibleItems, query, sort]);

  if (isLoading) return <p className="py-8 text-center text-sm text-text-muted">Loading…</p>;
  if (visibleItems.length === 0)
    return <EmptyState icon={emptyIcon} title={`No ${kind} items yet`} subtitle={emptyText} />;

  return (
    <div className="space-y-3">
      <div className="relative">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={`Search ${kind}…`}
          className="pl-9"
        />
      </div>

      <div className="flex gap-2 text-sm">
        {(['most', 'rated', 'name'] as SortKey[]).map((k) => (
          <button
            key={k}
            onClick={() => setSort(k)}
            className={
              'rounded-full px-3 py-1 ' +
              (sort === k ? 'bg-primary text-primary-fg' : 'bg-surface-alt text-text-muted')
            }
          >
            {k === 'most' ? 'Most logged' : k === 'rated' ? 'Top rated' : 'A–Z'}
          </button>
        ))}
      </div>

      {kind === 'drink' ? (
        <div className="space-y-2">
          {shown.map((item) => (
            <div key={item.id} className="flex items-center gap-3">
              <BeverageThumb name={item.name} />
              <Card className="min-w-0 flex-1 overflow-hidden">
                <ListRow
                  title={item.name}
                  subtitle={countLabel(item.count)}
                  right={<RatingBadge value={item.avg_rating} scale={settings.rating_scale} />}
                  chevron
                  onClick={() => setSelected(item)}
                />
              </Card>
            </div>
          ))}
          {shown.length === 0 && (
            <Card className="px-4 py-6 text-center text-sm text-text-muted">
              <Database className="mx-auto mb-1 opacity-50" size={20} />
              No matches.
            </Card>
          )}
        </div>
      ) : (
        <Card>
          {shown.map((item) => {
            const mealLine = kind === 'venue' ? venueMealSubtitle(item, settings.rating_scale) : null;
            return (
              <div key={item.id} className="border-t border-border first:border-t-0">
                <ListRow
                  title={item.name}
                  subtitle={mealLine ?? countLabel(item.count)}
                  right={<RatingBadge value={item.avg_rating} scale={settings.rating_scale} />}
                  chevron
                  onClick={() => setSelected(item)}
                />
              </div>
            );
          })}
          {shown.length === 0 && (
            <div className="px-4 py-6 text-center text-sm text-text-muted">
              <Database className="mx-auto mb-1 opacity-50" size={20} />
              No matches.
            </div>
          )}
        </Card>
      )}

      <ItemDetailSheet kind={kind} item={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
