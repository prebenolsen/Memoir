import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type {
  ActivityEntry,
  DrinkEntry,
  FoodEntry,
  PurchaseEntry,
} from '@/types/db';

export interface FoodEntryFull extends FoodEntry {
  food_item: { name: string } | null;
  restaurant: { name: string } | null;
}
export interface DrinkEntryFull extends DrinkEntry {
  drink_item: { name: string } | null;
}
export interface ActivityEntryFull extends ActivityEntry {
  activity_item: { name: string } | null;
}

export interface DayData {
  food: FoodEntryFull[];
  drinks: DrinkEntryFull[];
  activities: ActivityEntryFull[];
  purchases: PurchaseEntry[];
}

export function useDay(projectId: string | undefined, date: string) {
  return useQuery({
    queryKey: ['day', projectId, date],
    enabled: !!projectId,
    queryFn: async (): Promise<DayData> => {
      const base = (table: string, select: string) =>
        supabase
          .from(table)
          .select(select)
          .eq('project_id', projectId!)
          .eq('entry_date', date)
          .order('created_at');

      const [food, drinks, activities, purchases] = await Promise.all([
        base(
          'memoir_food_entries',
          '*, food_item:memoir_food_items(name), restaurant:memoir_restaurants(name)',
        ),
        base('memoir_drink_entries', '*, drink_item:memoir_drink_items(name)'),
        base('memoir_activity_entries', '*, activity_item:memoir_activity_items(name)'),
        base('memoir_purchase_entries', '*'),
      ]);
      for (const r of [food, drinks, activities, purchases]) if (r.error) throw r.error;
      return {
        food: (food.data ?? []) as unknown as FoodEntryFull[],
        drinks: (drinks.data ?? []) as unknown as DrinkEntryFull[],
        activities: (activities.data ?? []) as unknown as ActivityEntryFull[],
        purchases: (purchases.data ?? []) as unknown as PurchaseEntry[],
      };
    },
  });
}

export function dayCost(d: DayData | undefined): number {
  if (!d) return 0;
  const sum = (arr: { cost: number | null }[]) =>
    arr.reduce((acc, x) => acc + (x.cost ?? 0), 0);
  return sum(d.food) + sum(d.drinks) + sum(d.activities) + sum(d.purchases);
}
