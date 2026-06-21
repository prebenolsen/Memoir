// Hand-written database types mirroring supabase/migrations/0001_init.sql.

export type MealType = 'breakfast' | 'lunch' | 'dinner';
export type FoodSource = 'home' | 'restaurant' | 'cafe';
export type DrinkType = 'beer' | 'wine' | 'cocktail' | 'spirit' | 'other';
export type PurchaseCategory = 'clothes' | 'souvenir' | 'electronics' | 'other';

export type DateFormat = 'DD.MM.YYYY' | 'MM/DD/YYYY' | 'YYYY-MM-DD';
export type Currency = 'NOK' | 'EUR' | 'USD' | 'Other';
export type RatingScale = 5 | 10;
export type FirstDayOfWeek = 'monday' | 'sunday';
export type Theme = 'light' | 'dark' | 'system';

export interface Project {
  id: string;
  user_id: string;
  name: string;
  start_date: string | null;
  end_date: string | null;
  is_default: boolean;
  settings_override: Partial<Settings> | null;
  created_at: string;
}

export interface Settings {
  user_id: string;
  date_format: DateFormat;
  currency: Currency;
  rating_scale: RatingScale;
  first_day_of_week: FirstDayOfWeek;
  theme: Theme;
  remember_last_project: boolean;
  remember_last_date: boolean;
  confirm_before_delete: boolean;
  last_project_id: string | null;
  last_date: string | null;
  created_at: string;
}

export interface FoodItem {
  id: string;
  user_id: string;
  name: string;
  default_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface Restaurant {
  id: string;
  user_id: string;
  name: string;
  source: FoodSource | null;
  default_rating: number | null;
  notes: string | null;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  osm_id: string | null;
  created_at: string;
}

export interface DrinkItem {
  id: string;
  user_id: string;
  name: string;
  drink_type: DrinkType;
  default_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  user_id: string;
  name: string;
  default_rating: number | null;
  notes: string | null;
  created_at: string;
}

export interface FoodEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  meal_type: MealType;
  source: FoodSource;
  food_item_id: string | null;
  restaurant_id: string | null;
  starter: string | null;
  main_course: string | null;
  dessert: string | null;
  rating: number | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface DrinkEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  drink_item_id: string | null;
  drink_type: DrinkType;
  count_05l: number;
  count_033l: number;
  quantity: number;
  rating: number | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  activity_item_id: string | null;
  description: string | null;
  rating: number | null;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

export interface PurchaseEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  item_name: string;
  category: PurchaseCategory;
  cost: number | null;
  notes: string | null;
  created_at: string;
}

// Stat view rows
export interface FoodItemStat {
  food_item_id: string;
  user_id: string;
  times_eaten: number;
  avg_rating: number | null;
}
export interface RestaurantStat {
  restaurant_id: string;
  user_id: string;
  visits: number;
  avg_rating: number | null;
}
export interface DrinkItemStat {
  drink_item_id: string;
  user_id: string;
  times_consumed: number;
  total_05l: number;
  total_033l: number;
  total_qty: number;
  avg_rating: number | null;
}
export interface ActivityItemStat {
  activity_item_id: string;
  user_id: string;
  times_done: number;
  avg_rating: number | null;
}

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner'];
export const FOOD_SOURCES: FoodSource[] = ['home', 'restaurant', 'cafe'];
export const DRINK_TYPES: DrinkType[] = ['beer', 'wine', 'cocktail', 'spirit', 'other'];
export const PURCHASE_CATEGORIES: PurchaseCategory[] = ['clothes', 'souvenir', 'electronics', 'other'];

export type ExpenseCategory = 'food' | 'alcohol' | 'activities' | 'purchases' | 'other';
