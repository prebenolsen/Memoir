import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { itemConfig, type ItemKind } from '@/hooks/useItems';

export interface Occasion {
  id: string;
  entry_date: string;
  project_id: string;
  project_name: string;
  rating: number | null;
  cost: number | null;
  notes: string | null;
  detail: string | null;
}

const ENTRY_TABLE: Record<ItemKind, { table: string; fk: string; detailCol?: string }> = {
  food: { table: 'memoir_food_entries', fk: 'food_item_id', detailCol: 'main_course' },
  venue: { table: 'memoir_food_entries', fk: 'venue_id', detailCol: 'main_course' },
  drink: { table: 'memoir_drink_entries', fk: 'drink_item_id' },
  activity: { table: 'memoir_activity_entries', fk: 'activity_item_id' },
};

/** All occasions (history entries) for a given reusable item, newest first. */
export function useItemOccasions(kind: ItemKind, itemId: string | null) {
  return useQuery({
    queryKey: ['itemDetail', kind, itemId],
    enabled: !!itemId,
    queryFn: async (): Promise<Occasion[]> => {
      const cfg = ENTRY_TABLE[kind];
      const detail = cfg.detailCol ? `, ${cfg.detailCol}` : '';
      const selectStr = `id, entry_date, rating, cost, notes${detail}, project:memoir_projects(id, name)`;
      const { data, error } = await supabase
        .from(cfg.table)
        .select(selectStr)
        .eq(cfg.fk, itemId!)
        .order('entry_date', { ascending: false });
      if (error) throw error;
      const rows = (data ?? []) as unknown as Record<string, unknown>[];
      return rows.map((r) => {
        const project = r.project as { id: string; name: string } | null;
        return {
          id: r.id as string,
          entry_date: r.entry_date as string,
          project_id: project?.id ?? '',
          project_name: project?.name ?? '',
          rating: (r.rating as number | null) ?? null,
          cost: (r.cost as number | null) ?? null,
          notes: (r.notes as string | null) ?? null,
          detail: cfg.detailCol ? ((r[cfg.detailCol] as string | null) ?? null) : null,
        };
      });
    },
  });
}

export function entryEditKind(kind: ItemKind): 'food' | 'drink' | 'activity' {
  if (kind === 'drink') return 'drink';
  if (kind === 'activity') return 'activity';
  return 'food';
}

export { itemConfig };
