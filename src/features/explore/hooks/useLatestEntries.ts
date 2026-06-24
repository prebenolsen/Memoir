import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ItemKind } from '@/hooks/useItems';

/** One recent occasion of an item, for the Explore "latest" rows. */
export interface LatestEntry {
  id: string;
  name: string;
  entry_date: string;
  rating: number | null;
}

interface LatestConfig {
  table: string;
  /** Embedded item table + the name column to read from it. */
  join: string;
  /** Path to the item's name in the joined row. */
  namePath: string;
  /** Only rows where this column is set are kept (null item rows skipped). */
  requireColumn: string;
  /** Free-text fallback when the joined item is absent. */
  fallbackColumn?: string;
}

const CONFIGS: Record<ItemKind, LatestConfig | null> = {
  food: null,
  venue: {
    table: 'memoir_food_entries',
    join: 'memoir_venues(name)',
    namePath: 'memoir_venues',
    requireColumn: 'venue_id',
  },
  drink: {
    table: 'memoir_drink_entries',
    join: 'memoir_drink_items(name)',
    namePath: 'memoir_drink_items',
    requireColumn: 'drink_item_id',
  },
  activity: {
    table: 'memoir_activity_entries',
    join: 'memoir_activity_items(name)',
    namePath: 'memoir_activity_items',
    requireColumn: 'activity_item_id',
    fallbackColumn: 'description',
  },
};

/** The 5 most recent entries for a category, newest first, joined to item name. */
export function useLatestEntries(kind: ItemKind, limit = 5) {
  const cfg = CONFIGS[kind];
  return useQuery({
    queryKey: ['latestEntries', kind, limit],
    enabled: !!cfg,
    queryFn: async (): Promise<LatestEntry[]> => {
      if (!cfg) return [];
      const cols = ['id', 'entry_date', 'rating', cfg.requireColumn, cfg.join];
      if (cfg.fallbackColumn) cols.push(cfg.fallbackColumn);
      const { data, error } = await supabase
        .from(cfg.table)
        .select(cols.join(','))
        .not(cfg.requireColumn, 'is', null)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return ((data ?? []) as unknown as Record<string, unknown>[]).map((row) => {
        const joined = row[cfg.namePath] as { name?: string } | null;
        const name =
          joined?.name ??
          (cfg.fallbackColumn ? (row[cfg.fallbackColumn] as string | null) : null) ??
          'Untitled';
        return {
          id: row.id as string,
          name,
          entry_date: row.entry_date as string,
          rating: (row.rating as number | null) ?? null,
        };
      });
    },
  });
}
