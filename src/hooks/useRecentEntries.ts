import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { titleCase } from '@/lib/format';
import type { EntryTable } from '@/hooks/useEntryMutations';
import type { AddKind } from '@/lib/quickAdd';

/** A recently logged entry, with everything needed to re-log it in one tap. */
export interface RecentEntry {
  /** The original entry's id — used only as a React key. */
  id: string;
  table: EntryTable;
  kind: AddKind;
  label: string;
  createdAt: string;
  /** Content fields to clone onto a fresh entry (no id/date/project/user). */
  payload: Record<string, unknown>;
}

type Row = Record<string, unknown>;

interface Source {
  table: EntryTable;
  kind: AddKind;
  select: string;
  label: (r: Row) => string;
  /** Embedded relation keys to drop before cloning. */
  strip: string[];
}

const named = (r: Row, key: string): string | null =>
  (r[key] as { name?: string } | null)?.name ?? null;

const SOURCES: Source[] = [
  {
    table: 'memoir_food_entries',
    kind: 'food',
    select: '*, food_item:memoir_food_items(name), restaurant:memoir_restaurants(name)',
    label: (r) =>
      named(r, 'restaurant') ?? named(r, 'food_item') ?? (r.main_course as string | null) ?? 'Food',
    strip: ['food_item', 'restaurant'],
  },
  {
    table: 'memoir_drink_entries',
    kind: 'drink',
    select: '*, drink_item:memoir_drink_items(name)',
    label: (r) => named(r, 'drink_item') ?? titleCase((r.drink_type as string) ?? 'drink'),
    strip: ['drink_item'],
  },
  {
    table: 'memoir_activity_entries',
    kind: 'activity',
    select: '*, activity_item:memoir_activity_items(name)',
    label: (r) => named(r, 'activity_item') ?? (r.description as string | null) ?? 'Activity',
    strip: ['activity_item'],
  },
  {
    table: 'memoir_purchase_entries',
    kind: 'purchase',
    select: '*',
    label: (r) => (r.item_name as string | null) ?? 'Purchase',
    strip: [],
  },
];

// Fields that belong to a specific occasion, not the entry's content — dropped so
// the clone lands on the current day/project as a brand-new row.
const OMIT = ['id', 'user_id', 'created_at', 'entry_date', 'project_id'];

/** The `limit` most recently created entries across all categories, newest first. */
export function useRecentEntries(enabled = true, limit = 5) {
  return useQuery({
    queryKey: ['recentEntries', limit],
    enabled,
    queryFn: async (): Promise<RecentEntry[]> => {
      const perSource = await Promise.all(
        SOURCES.map(async (s) => {
          const { data, error } = await supabase
            .from(s.table)
            .select(s.select)
            .order('created_at', { ascending: false })
            .limit(limit);
          if (error) throw error;
          return ((data ?? []) as unknown as Row[]).map((r): RecentEntry => {
            const payload: Row = { ...r };
            for (const k of [...OMIT, ...s.strip]) delete payload[k];
            return {
              id: r.id as string,
              table: s.table,
              kind: s.kind,
              label: s.label(r),
              createdAt: r.created_at as string,
              payload,
            };
          });
        }),
      );
      return perSource
        .flat()
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
        .slice(0, limit);
    },
  });
}
