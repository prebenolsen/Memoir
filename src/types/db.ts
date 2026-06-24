// Hand-written database types mirroring supabase/migrations/0001_init.sql.

export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';
export type SnackType = 'ice_cream' | 'pastry' | 'cake' | 'candy' | 'dessert' | 'other';
export type FoodSource = 'home' | 'venue';
export type DrinkType = 'beer' | 'wine' | 'cocktail' | 'spirit' | 'other';
export type WineStyle = 'red' | 'white' | 'rose' | 'sparkling';
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

export interface Venue {
  id: string;
  user_id: string;
  name: string;
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
  snack_type: SnackType | null;
  source: FoodSource;
  food_item_id: string | null;
  venue_id: string | null;
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
  wine_style: WineStyle | null;
  abv: number | null;
  count_033l: number;
  count_04l: number;
  count_05l: number;
  count_0568l: number;
  count_06l: number;
  quantity: number;
  rating: number | null;
  cost: number | null;
  notes: string | null;
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
}

export interface ActivityEntry {
  id: string;
  user_id: string;
  project_id: string;
  entry_date: string;
  activity_item_id: string | null;
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

// Social layer (usernames + friends)
export type FriendshipStatus = 'pending' | 'accepted';

export interface Profile {
  user_id: string;
  username: string | null;
  email: string | null;
  created_at: string;
}

export interface Friendship {
  id: string;
  requester_id: string;
  addressee_id: string;
  status: FriendshipStatus;
  created_at: string;
  responded_at: string | null;
}

/** Aggregated venue favorite shared by a friend (from the RPC). */
export interface FriendFavorite {
  friend_id: string;
  friend_username: string | null;
  venue_id: string;
  name: string;
  latitude: number | null;
  longitude: number | null;
  address: string | null;
  avg_rating: number | null;
  visits: number;
}

/** Aggregated beverage favorite shared by a friend (from the RPC). */
export interface FriendDrinkFavorite {
  friend_id: string;
  friend_username: string | null;
  drink_id: string;
  name: string;
  drink_type: DrinkType;
  avg_rating: number | null;
  count: number;
}

// Stat view rows
export interface FoodItemStat {
  food_item_id: string;
  user_id: string;
  times_eaten: number;
  avg_rating: number | null;
}
export interface VenueStat {
  venue_id: string;
  user_id: string;
  visits: number;
  avg_rating: number | null;
}
export interface VenueMealStat {
  venue_id: string;
  user_id: string;
  meal_type: MealType;
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

export const MEAL_TYPES: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
export const FOOD_SOURCES: FoodSource[] = ['home', 'venue'];

export const SNACK_TYPES: { value: SnackType; label: string }[] = [
  { value: 'ice_cream', label: 'Ice cream' },
  { value: 'pastry', label: 'Pastry' },
  { value: 'cake', label: 'Cake' },
  { value: 'candy', label: 'Candy' },
  { value: 'dessert', label: 'Dessert' },
  { value: 'other', label: 'Other' },
];

export function snackTypeLabel(t: SnackType): string {
  return SNACK_TYPES.find((s) => s.value === t)?.label ?? t;
}
export const DRINK_TYPES: DrinkType[] = ['beer', 'wine', 'cocktail', 'spirit', 'other'];

export const WINE_STYLES: { value: WineStyle; label: string }[] = [
  { value: 'red', label: 'Red' },
  { value: 'white', label: 'White' },
  { value: 'rose', label: 'Rosé' },
  { value: 'sparkling', label: 'Sparkling' },
];

export function wineStyleLabel(style: WineStyle): string {
  return WINE_STYLES.find((w) => w.value === style)?.label ?? style;
}

/** Default ABV (%) the wheel picker starts on for each type that tracks it. */
export const DEFAULT_ABV: Partial<Record<DrinkType, number>> = {
  beer: 4.7,
  wine: 12.5,
};

/** A beer serving size, picked from a dropdown, with a name used when none is typed. */
export interface BeerSize {
  /** Stable key (matches the db column suffix). */
  key: string;
  /** Column on memoir_drink_entries that stores this size's count. */
  column: 'count_033l' | 'count_04l' | 'count_05l' | 'count_0568l' | 'count_06l';
  /** Volume in litres, used for ordering. */
  liters: number;
  /** Label shown in the size dropdown, e.g. "0.568l (pint)". */
  label: string;
  /** Compact label for summaries, e.g. "0.5l". */
  short: string;
}

export const BEER_SIZES: BeerSize[] = [
  { key: '033', column: 'count_033l', liters: 0.33, label: '0.33l', short: '0.33l' },
  { key: '04', column: 'count_04l', liters: 0.4, label: '0.4l', short: '0.4l' },
  { key: '05', column: 'count_05l', liters: 0.5, label: '0.5l', short: '0.5l' },
  { key: '0568', column: 'count_0568l', liters: 0.568, label: '0.568l (pint)', short: '0.568l' },
  { key: '06', column: 'count_06l', liters: 0.6, label: '0.6l', short: '0.6l' },
];

export const BEER_EMPTY_NAME = 'Beer';

/** Name applied to a wine when the name field is left blank, per style. */
export const WINE_EMPTY_NAMES: Record<WineStyle, string> = {
  red: 'A glass of red',
  white: 'A glass of white',
  rose: 'A glass of rosé',
  sparkling: 'A glass of sparkling',
};

/** Realistic name examples shown as the drink-name placeholder per type. */
export const DRINK_NAME_PLACEHOLDERS: Record<DrinkType, string> = {
  beer: 'e.g. Estrella Galicia',
  wine: 'e.g. Catena Malbec',
  cocktail: 'e.g. Negroni',
  spirit: 'e.g. Lagavulin 16',
  other: 'e.g. Somersby Apple',
};

/** Seeds for the cocktail autocomplete; users can still type any custom name. */
export const COCKTAIL_SUGGESTIONS: string[] = [
  'Aperol Spritz',
  'Negroni',
  'Old Fashioned',
  'Margarita',
  'Mojito',
  'Daiquiri',
  'Whiskey Sour',
  'Espresso Martini',
  'Martini',
  'Manhattan',
  'Moscow Mule',
  "Dark 'n' Stormy",
  'Piña Colada',
  'Mai Tai',
  'Cosmopolitan',
  'Long Island Iced Tea',
  'Tom Collins',
  'French 75',
  'Paloma',
  'Caipirinha',
  'Gin&Tonic',
];

export const PURCHASE_CATEGORIES: PurchaseCategory[] = ['clothes', 'souvenir', 'electronics', 'other'];

export type ExpenseCategory = 'food' | 'alcohol' | 'activities' | 'purchases' | 'other';
