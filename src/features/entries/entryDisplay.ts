import { baseDrinkName, formatAbv, titleCase } from '@/lib/format';
import { BEER_SIZES, snackTypeLabel, wineStyleLabel } from '@/types/db';
import type { DrinkEntryFull, FoodEntryFull, ActivityEntryFull } from '@/features/entries/hooks/useDay';

export function foodTitle(e: FoodEntryFull): string {
  return e.food_item?.name || e.main_course || e.venue?.name || 'Food';
}

export function foodSubtitle(e: FoodEntryFull): string {
  // For snacks, refine the meal label with the sub-type, e.g. "Snack · Ice cream".
  const mealLabel =
    e.meal_type === 'snack' && e.snack_type
      ? `Snack · ${snackTypeLabel(e.snack_type)}`
      : titleCase(e.meal_type);
  const bits: string[] = [mealLabel];
  if (e.venue?.name && e.food_item?.name) bits.push(e.venue.name);
  else if (e.source !== 'home' && !e.venue?.name) bits.push('Venue');
  const courses = [e.starter, e.main_course, e.dessert].filter(Boolean);
  if (courses.length && !e.food_item?.name) return bits.join(' · ');
  if (courses.length) bits.push(courses.join(' / '));
  return bits.join(' · ');
}

export function drinkTitle(e: DrinkEntryFull): string {
  const name = e.drink_item?.name;
  if (!name) return titleCase(e.drink_type);
  // Beer/wine size and ABV are shown separately (see drinkAmount), so strip any
  // legacy baked-in suffix from the stored name for a clean, consistent title.
  if (e.drink_type === 'beer' || e.drink_type === 'wine') return baseDrinkName(name) || name;
  return name;
}

export function drinkAmount(e: DrinkEntryFull): string {
  const parts: string[] = [];
  if (e.drink_type === 'wine' && e.wine_style) parts.push(wineStyleLabel(e.wine_style));

  if (e.drink_type === 'beer') {
    const glasses = BEER_SIZES.filter((s) => e[s.column]).map(
      (s) => `${e[s.column]}×${s.short}`,
    );
    parts.push(glasses.join(' + ') || `${e.quantity}`);
  } else if (e.quantity > 1) {
    parts.push(`×${e.quantity}`);
  }

  if (e.abv != null) parts.push(`${formatAbv(e.abv)}%`);
  return parts.join(' · ');
}

export function activityTitle(e: ActivityEntryFull): string {
  return e.activity_item?.name || 'Activity';
}
