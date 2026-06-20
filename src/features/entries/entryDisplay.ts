import { titleCase } from '@/lib/format';
import type { DrinkEntryFull, FoodEntryFull, ActivityEntryFull } from '@/hooks/useDay';

export function foodTitle(e: FoodEntryFull): string {
  return e.food_item?.name || e.main_course || e.restaurant?.name || 'Food';
}

export function foodSubtitle(e: FoodEntryFull): string {
  const bits: string[] = [titleCase(e.meal_type)];
  if (e.restaurant?.name && e.food_item?.name) bits.push(e.restaurant.name);
  else if (e.source !== 'home' && !e.restaurant?.name) bits.push(titleCase(e.source));
  const courses = [e.starter, e.main_course, e.dessert].filter(Boolean);
  if (courses.length && !e.food_item?.name) return bits.join(' · ');
  if (courses.length) bits.push(courses.join(' / '));
  return bits.join(' · ');
}

export function drinkTitle(e: DrinkEntryFull): string {
  return e.drink_item?.name || titleCase(e.drink_type);
}

export function drinkAmount(e: DrinkEntryFull): string {
  if (e.drink_type === 'beer') {
    const parts: string[] = [];
    if (e.count_05l) parts.push(`${e.count_05l}×0.5L`);
    if (e.count_033l) parts.push(`${e.count_033l}×0.33L`);
    return parts.join(' + ') || `${e.quantity}`;
  }
  return e.quantity > 1 ? `×${e.quantity}` : '';
}

export function activityTitle(e: ActivityEntryFull): string {
  return e.activity_item?.name || 'Activity';
}
