import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/format';

/**
 * Resolve a Combobox selection to a concrete item id, creating the reusable
 * item if it does not yet exist. Called at entry-save time so typing a new name
 * stays a single-tap action and we never orphan items from abandoned forms.
 */
export async function resolveItem(
  table: string,
  selection: { id: string | null; name: string } | null,
  extra: Record<string, unknown> = {},
): Promise<string | null> {
  if (!selection || !selection.name.trim()) return null;
  if (selection.id) return selection.id;

  const name = selection.name.trim();
  // Case-insensitive exact match first (respects unique(user_id, lower(name))).
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) return existing.id as string;

  const id = newId();
  const { data, error } = await supabase
    .from(table)
    .insert({ id, name, ...extra })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

export interface ItemWithStats {
  id: string;
  name: string;
  default_rating: number | null;
  notes: string | null;
  count: number;
  avg_rating: number | null;
  extra?: Record<string, unknown>;
}

interface ItemListConfig {
  itemTable: string;
  statView: string;
  statIdField: string;
  countField: string;
  /** Extra columns to select from the item table. */
  extraColumns?: string[];
}

const CONFIGS: Record<string, ItemListConfig> = {
  food: {
    itemTable: 'memoir_food_items',
    statView: 'memoir_food_item_stats',
    statIdField: 'food_item_id',
    countField: 'times_eaten',
  },
  restaurant: {
    itemTable: 'memoir_restaurants',
    statView: 'memoir_restaurant_stats',
    statIdField: 'restaurant_id',
    countField: 'visits',
    extraColumns: ['source'],
  },
  drink: {
    itemTable: 'memoir_drink_items',
    statView: 'memoir_drink_item_stats',
    statIdField: 'drink_item_id',
    countField: 'times_consumed',
    extraColumns: ['drink_type'],
  },
  activity: {
    itemTable: 'memoir_activity_items',
    statView: 'memoir_activity_item_stats',
    statIdField: 'activity_item_id',
    countField: 'times_done',
  },
};

export type ItemKind = keyof typeof CONFIGS;

export function useItemList(kind: ItemKind) {
  const cfg = CONFIGS[kind];
  return useQuery({
    queryKey: ['itemList', kind],
    queryFn: async (): Promise<ItemWithStats[]> => {
      const cols = ['id', 'name', 'default_rating', 'notes', ...(cfg.extraColumns ?? [])].join(',');
      const [{ data: items, error: e1 }, { data: stats, error: e2 }] = await Promise.all([
        supabase.from(cfg.itemTable).select(cols).order('name'),
        supabase.from(cfg.statView).select('*'),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const statMap = new Map<string, Record<string, number | null>>();
      (stats ?? []).forEach((s: Record<string, unknown>) => {
        statMap.set(s[cfg.statIdField] as string, s as Record<string, number | null>);
      });
      return ((items ?? []) as unknown as Record<string, unknown>[]).map((it) => {
        const s = statMap.get(it.id as string);
        const extra: Record<string, unknown> = {};
        (cfg.extraColumns ?? []).forEach((c) => (extra[c] = it[c]));
        return {
          id: it.id as string,
          name: it.name as string,
          default_rating: (it.default_rating as number | null) ?? null,
          notes: (it.notes as string | null) ?? null,
          count: (s?.[cfg.countField] as number) ?? 0,
          avg_rating: (s?.avg_rating as number | null) ?? (it.default_rating as number | null) ?? null,
          extra,
        };
      });
    },
  });
}

/** Update an item's headline rating / notes / name. */
export async function updateItem(
  kind: ItemKind,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const cfg = CONFIGS[kind];
  const { error } = await supabase.from(cfg.itemTable).update(patch).eq('id', id);
  if (error) throw error;
}

export function itemConfig(kind: ItemKind) {
  return CONFIGS[kind];
}
