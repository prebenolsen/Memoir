import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BEER_SIZES, WINE_STYLES } from '@/types/db';
import type { ExpenseCategory, WineStyle } from '@/types/db';

export interface NamedCount {
  name: string;
  count: number;
}
export interface NamedRating {
  name: string;
  rating: number;
}
/** One beer serving size with how many were drunk and the litres that totals. */
export interface BeerSizeStat {
  key: string;
  short: string;
  units: number;
  litres: number;
}
/** Glasses of a single wine style, for the by-type bar graph. */
export interface WineStyleStat {
  style: WineStyle;
  label: string;
  glasses: number;
}

export interface ProjectStats {
  // Food
  foodEntries: number;
  venuesVisited: number;
  mostEaten: NamedCount[];
  topRatedFoods: NamedRating[];
  avgFoodRating: number | null;
  // Alcohol
  drinkEntries: number;
  totalBeers: number;
  totalBeerLitres: number;
  beerSizes: BeerSizeStat[];
  wineGlasses: WineStyleStat[];
  mostConsumed: NamedCount[];
  topRatedDrinks: NamedRating[];
  // Activities
  activitiesCompleted: number;
  topRatedActivities: NamedRating[];
  // Money
  totalSpent: number;
  byCategory: Record<ExpenseCategory, number>;
  dailyAverage: number;
  activeDays: number;
}

function topCounts(map: Map<string, number>, n = 5): NamedCount[] {
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}

function topRatings(map: Map<string, number[]>, n = 5): NamedRating[] {
  return [...map.entries()]
    .map(([name, arr]) => ({ name, rating: arr.reduce((a, b) => a + b, 0) / arr.length }))
    .sort((a, b) => b.rating - a.rating)
    .slice(0, n);
}

/**
 * Compute aggregate stats for a project, or for everything ever recorded.
 * - undefined → loading, query disabled
 * - null      → "Everything" mode, all projects included
 * - string    → specific project filter
 * Optional `from`/`to` (YYYY-MM-DD) bound the entry dates inclusively.
 */
export function useProjectStats(
  projectId: string | null | undefined,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: ['stats', projectId, from, to],
    enabled: projectId !== undefined,
    queryFn: async (): Promise<ProjectStats> => {
      const p = (table: string, select: string) => {
        let q = supabase.from(table).select(select);
        if (projectId !== null) q = q.eq('project_id', projectId!);
        if (from) q = q.gte('entry_date', from);
        if (to) q = q.lte('entry_date', to);
        return q;
      };

      const [food, drinks, activities, purchases] = await Promise.all([
        p(
          'memoir_food_entries',
          'entry_date, rating, cost, venue_id, food_item:memoir_food_items(name)',
        ),
        p('memoir_drink_entries', 'entry_date, rating, cost, drink_type, wine_style, count_033l, count_04l, count_05l, count_0568l, count_06l, quantity, drink_item:memoir_drink_items(name)'),
        p('memoir_activity_entries', 'entry_date, rating, cost, activity_item:memoir_activity_items(name)'),
        p('memoir_purchase_entries', 'entry_date, cost'),
      ]);
      for (const r of [food, drinks, activities, purchases]) if (r.error) throw r.error;

      const foodRows = (food.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; venue_id: string | null; food_item: { name: string } | null;
      }[];
      const drinkRows = (drinks.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; drink_type: string; wine_style: WineStyle | null; count_033l: number; count_04l: number; count_05l: number; count_0568l: number; count_06l: number; quantity: number; drink_item: { name: string } | null;
      }[];
      const activityRows = (activities.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; activity_item: { name: string } | null;
      }[];
      const purchaseRows = (purchases.data ?? []) as unknown as {
        entry_date: string; cost: number | null;
      }[];

      // Food
      const venues = new Set<string>();
      const foodCounts = new Map<string, number>();
      const foodRatings = new Map<string, number[]>();
      let foodRatingSum = 0;
      let foodRatingN = 0;
      for (const f of foodRows) {
        if (f.venue_id) venues.add(f.venue_id);
        const name = f.food_item?.name;
        if (name) foodCounts.set(name, (foodCounts.get(name) ?? 0) + 1);
        if (f.rating != null) {
          foodRatingSum += f.rating;
          foodRatingN += 1;
          if (name) {
            const arr = foodRatings.get(name) ?? [];
            arr.push(f.rating);
            foodRatings.set(name, arr);
          }
        }
      }

      // Alcohol
      let totalBeers = 0;
      let totalBeerLitres = 0;
      const beerSizeUnits = new Map<string, number>(); // BeerSize.key -> glasses
      const wineGlassesByStyle = new Map<WineStyle, number>();
      const drinkCounts = new Map<string, number>();
      const drinkRatings = new Map<string, number[]>();
      for (const d of drinkRows) {
        const beerTotal =
          d.count_033l + d.count_04l + d.count_05l + d.count_0568l + d.count_06l;
        if (d.drink_type === 'beer') {
          totalBeers += beerTotal;
          for (const s of BEER_SIZES) {
            const units = d[s.column];
            if (units) {
              beerSizeUnits.set(s.key, (beerSizeUnits.get(s.key) ?? 0) + units);
              totalBeerLitres += units * s.liters;
            }
          }
        } else if (d.drink_type === 'wine' && d.wine_style) {
          wineGlassesByStyle.set(
            d.wine_style,
            (wineGlassesByStyle.get(d.wine_style) ?? 0) + d.quantity,
          );
        }
        const name = d.drink_item?.name;
        const qty = d.drink_type === 'beer' ? beerTotal || d.quantity : d.quantity;
        if (name) drinkCounts.set(name, (drinkCounts.get(name) ?? 0) + qty);
        if (d.rating != null && name) {
          const arr = drinkRatings.get(name) ?? [];
          arr.push(d.rating);
          drinkRatings.set(name, arr);
        }
      }

      // Activities
      const activityRatings = new Map<string, number[]>();
      for (const a of activityRows) {
        const name = a.activity_item?.name;
        if (a.rating != null && name) {
          const arr = activityRatings.get(name) ?? [];
          arr.push(a.rating);
          activityRatings.set(name, arr);
        }
      }

      // Money
      const byCategory: Record<ExpenseCategory, number> = {
        food: 0, alcohol: 0, activities: 0, purchases: 0, other: 0,
      };
      const days = new Set<string>();
      const addCost = (cat: ExpenseCategory, cost: number | null, date: string) => {
        if (cost) byCategory[cat] += cost;
        days.add(date);
      };
      foodRows.forEach((f) => addCost('food', f.cost, f.entry_date));
      drinkRows.forEach((d) => addCost('alcohol', d.cost, d.entry_date));
      activityRows.forEach((a) => addCost('activities', a.cost, a.entry_date));
      purchaseRows.forEach((pr) => addCost('purchases', pr.cost, pr.entry_date));

      const totalSpent =
        byCategory.food + byCategory.alcohol + byCategory.activities + byCategory.purchases + byCategory.other;
      const activeDays = days.size;

      const beerSizes: BeerSizeStat[] = BEER_SIZES.filter((s) => beerSizeUnits.get(s.key)).map(
        (s) => {
          const units = beerSizeUnits.get(s.key)!;
          return { key: s.key, short: s.short, units, litres: units * s.liters };
        },
      );
      const wineGlasses: WineStyleStat[] = WINE_STYLES.filter(
        (w) => wineGlassesByStyle.get(w.value),
      ).map((w) => ({ style: w.value, label: w.label, glasses: wineGlassesByStyle.get(w.value)! }));

      return {
        foodEntries: foodRows.length,
        venuesVisited: venues.size,
        mostEaten: topCounts(foodCounts),
        topRatedFoods: topRatings(foodRatings),
        avgFoodRating: foodRatingN ? foodRatingSum / foodRatingN : null,
        drinkEntries: drinkRows.length,
        totalBeers,
        totalBeerLitres,
        beerSizes,
        wineGlasses,
        mostConsumed: topCounts(drinkCounts),
        topRatedDrinks: topRatings(drinkRatings),
        activitiesCompleted: activityRows.length,
        topRatedActivities: topRatings(activityRatings),
        totalSpent,
        byCategory,
        dailyAverage: activeDays ? totalSpent / activeDays : 0,
        activeDays,
      };
    },
  });
}

/**
 * Earliest and latest entry dates recorded for a project (across food, drinks,
 * activities and purchases), ignoring any active date filter. Used to seed the
 * Stats date range to the project's full span. Returns nulls when empty.
 *   - undefined → loading, query disabled
 *   - null      → "Everything" mode, all projects included
 *   - string    → specific project filter
 */
export function useProjectDateBounds(projectId: string | null | undefined) {
  return useQuery({
    queryKey: ['stats', 'bounds', projectId],
    enabled: projectId !== undefined,
    queryFn: async (): Promise<{ min: string | null; max: string | null }> => {
      const tables = [
        'memoir_food_entries',
        'memoir_drink_entries',
        'memoir_activity_entries',
        'memoir_purchase_entries',
      ];
      const edge = (table: string, ascending: boolean) => {
        let q = supabase.from(table).select('entry_date');
        if (projectId !== null) q = q.eq('project_id', projectId!);
        return q.order('entry_date', { ascending }).limit(1);
      };
      const results = await Promise.all(tables.flatMap((t) => [edge(t, true), edge(t, false)]));
      let min: string | null = null;
      let max: string | null = null;
      for (const r of results) {
        if (r.error) throw r.error;
        const d = (r.data?.[0] as { entry_date: string } | undefined)?.entry_date;
        if (!d) continue;
        if (min === null || d < min) min = d;
        if (max === null || d > max) max = d;
      }
      return { min, max };
    },
  });
}
