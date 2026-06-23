import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { newId } from '@/lib/format';

/** Location fields that may travel in `extra` from the "Find location" flow. */
const LOCATION_KEYS = ['latitude', 'longitude', 'address', 'osm_id'] as const;

function locationPatch(extra: Record<string, unknown>): Record<string, unknown> {
  const patch: Record<string, unknown> = {};
  for (const key of LOCATION_KEYS) {
    if (extra[key] != null) patch[key] = extra[key];
  }
  return patch;
}

/**
 * Resolve a Combobox selection to a concrete item id, creating the reusable
 * item if it does not yet exist. Called at entry-save time so typing a new name
 * stays a single-tap action and we never orphan items from abandoned forms.
 *
 * When `extra` carries location fields (from the GPS "Find location" flow) we
 * dedupe by `osm_id` first and backfill coordinates on an existing row that is
 * missing them, so a picked place reliably keeps its location.
 */
export async function resolveItem(
  table: string,
  selection: { id: string | null; name: string } | null,
  extra: Record<string, unknown> = {},
): Promise<string | null> {
  if (!selection || !selection.name.trim()) return null;

  const patch = locationPatch(extra);
  const hasLocation = Object.keys(patch).length > 0;

  // Already-linked existing item: backfill location if we have it.
  if (selection.id) {
    if (hasLocation) await backfillLocation(table, selection.id, patch);
    return selection.id;
  }

  // Dedupe by OSM id when present (same physical place, any spelling).
  if (extra.osm_id) {
    const { data: byOsm } = await supabase
      .from(table)
      .select('id')
      .eq('osm_id', extra.osm_id as string)
      .limit(1)
      .maybeSingle();
    if (byOsm?.id) {
      if (hasLocation) await backfillLocation(table, byOsm.id as string, patch);
      return byOsm.id as string;
    }
  }

  const name = selection.name.trim();
  // Case-insensitive exact match next (respects unique(user_id, lower(name))).
  const { data: existing } = await supabase
    .from(table)
    .select('id')
    .ilike('name', name)
    .limit(1)
    .maybeSingle();
  if (existing?.id) {
    if (hasLocation) await backfillLocation(table, existing.id as string, patch);
    return existing.id as string;
  }

  const id = newId();
  const { data, error } = await supabase
    .from(table)
    .insert({ id, name, ...extra })
    .select('id')
    .single();
  if (error) throw error;
  return data.id as string;
}

/** Set location fields on an existing row only where they are currently null. */
async function backfillLocation(
  table: string,
  id: string,
  patch: Record<string, unknown>,
): Promise<void> {
  const { data: row } = await supabase
    .from(table)
    .select('latitude, longitude, address, osm_id')
    .eq('id', id)
    .maybeSingle();
  if (!row) return;
  const update: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(patch)) {
    if ((row as Record<string, unknown>)[key] == null) update[key] = val;
  }
  if (Object.keys(update).length === 0) return;
  await supabase.from(table).update(update).eq('id', id);
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

/** Entry table + foreign key that points back to each reusable item. */
const ENTRY_FK: Record<ItemKind, { table: string; fk: string }> = {
  food: { table: 'memoir_food_entries', fk: 'food_item_id' },
  restaurant: { table: 'memoir_food_entries', fk: 'restaurant_id' },
  drink: { table: 'memoir_drink_entries', fk: 'drink_item_id' },
  activity: { table: 'memoir_activity_entries', fk: 'activity_item_id' },
};

/**
 * Delete a reusable item along with all of its logged occasions. The entry FK is
 * `ON DELETE SET NULL`, so we remove the dependent entries first — otherwise they
 * would linger as orphaned rows with no item.
 */
export async function deleteItem(kind: ItemKind, id: string): Promise<void> {
  const cfg = CONFIGS[kind];
  const ent = ENTRY_FK[kind];
  const { error: entryErr } = await supabase.from(ent.table).delete().eq(ent.fk, id);
  if (entryErr) throw entryErr;
  const { error: itemErr } = await supabase.from(cfg.itemTable).delete().eq('id', id);
  if (itemErr) throw itemErr;
}

export function itemConfig(kind: ItemKind) {
  return CONFIGS[kind];
}
