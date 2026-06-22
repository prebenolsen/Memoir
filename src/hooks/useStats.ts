import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import type { ExpenseCategory } from '@/types/db';

export interface NamedCount {
  name: string;
  count: number;
}
export interface NamedRating {
  name: string;
  rating: number;
}

export interface ProjectStats {
  // Food
  restaurantsVisited: number;
  mostEaten: NamedCount[];
  topRatedFoods: NamedRating[];
  avgFoodRating: number | null;
  // Alcohol
  totalBeers: number;
  total05: number;
  total033: number;
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

export function useProjectStats(projectId: string | undefined) {
  return useQuery({
    queryKey: ['stats', projectId],
    enabled: !!projectId,
    queryFn: async (): Promise<ProjectStats> => {
      const p = (table: string, select: string) =>
        supabase.from(table).select(select).eq('project_id', projectId!);

      const [food, drinks, activities, purchases] = await Promise.all([
        p(
          'memoir_food_entries',
          'entry_date, rating, cost, restaurant_id, food_item:memoir_food_items(name)',
        ),
        p('memoir_drink_entries', 'entry_date, rating, cost, drink_type, count_033l, count_04l, count_05l, count_0568l, count_06l, quantity, drink_item:memoir_drink_items(name)'),
        p('memoir_activity_entries', 'entry_date, rating, cost, activity_item:memoir_activity_items(name)'),
        p('memoir_purchase_entries', 'entry_date, cost'),
      ]);
      for (const r of [food, drinks, activities, purchases]) if (r.error) throw r.error;

      const foodRows = (food.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; restaurant_id: string | null; food_item: { name: string } | null;
      }[];
      const drinkRows = (drinks.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; drink_type: string; count_033l: number; count_04l: number; count_05l: number; count_0568l: number; count_06l: number; quantity: number; drink_item: { name: string } | null;
      }[];
      const activityRows = (activities.data ?? []) as unknown as {
        entry_date: string; rating: number | null; cost: number | null; activity_item: { name: string } | null;
      }[];
      const purchaseRows = (purchases.data ?? []) as unknown as {
        entry_date: string; cost: number | null;
      }[];

      // Food
      const restaurants = new Set<string>();
      const foodCounts = new Map<string, number>();
      const foodRatings = new Map<string, number[]>();
      let foodRatingSum = 0;
      let foodRatingN = 0;
      for (const f of foodRows) {
        if (f.restaurant_id) restaurants.add(f.restaurant_id);
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
      let total05 = 0;
      let total033 = 0;
      const drinkCounts = new Map<string, number>();
      const drinkRatings = new Map<string, number[]>();
      for (const d of drinkRows) {
        const beerTotal =
          d.count_033l + d.count_04l + d.count_05l + d.count_0568l + d.count_06l;
        if (d.drink_type === 'beer') {
          total05 += d.count_05l;
          total033 += d.count_033l;
          totalBeers += beerTotal;
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

      return {
        restaurantsVisited: restaurants.size,
        mostEaten: topCounts(foodCounts),
        topRatedFoods: topRatings(foodRatings),
        avgFoodRating: foodRatingN ? foodRatingSum / foodRatingN : null,
        totalBeers,
        total05,
        total033,
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
