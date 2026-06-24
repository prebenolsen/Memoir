import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { BEER_SIZES, WINE_STYLES } from '@/types/db';
import { DAY_START_HOUR, logicalToday } from '@/lib/format';
import type { DrinkType, WineStyle } from '@/types/db';

export interface NamedCount {
  name: string;
  count: number;
}
export interface NamedRating {
  name: string;
  rating: number;
}
export interface BeerSizeStat {
  key: string;
  short: string;
  units: number;
  litres: number;
}
export interface WineStyleStat {
  style: WineStyle;
  label: string;
  glasses: number;
}
export interface TypeStat {
  type: DrinkType;
  servings: number;
  entries: number;
}
export interface HourBucket {
  hour: number;
  servings: number;
}
/** Drinks logged in a given calendar month (0 = Jan), summed across all years. */
export interface MonthBucket {
  month: number;
  servings: number;
}
/** Drinks logged so far this year against the same window a year ago. */
export interface YtdComparison {
  thisYear: number;
  lastYear: number;
  thisYearServings: number;
  lastYearServings: number;
  /** The day-of-year cutoff applied to both years, e.g. "24 Jun". */
  throughLabel: string;
}
export interface DayCount {
  date: string;
  servings: number;
}
export interface PlaceCount {
  name: string;
  servings: number;
  entries: number;
}
export interface MapPoint {
  id: string;
  lat: number;
  lon: number;
  name: string;
  date: string;
  rating: number | null;
}
/** A run of drinks with no >3h gap between consecutive logs. */
export interface SessionInfo {
  startMs: number;
  endMs: number;
  durationMin: number;
  drinks: number;
  date: string;
}
/** The earliest/latest clock time a drink was logged at, with its day. */
export interface ClockExtreme {
  ms: number;
  date: string;
  /** Local "HH:MM". */
  label: string;
}

export interface BeverageStats {
  totalEntries: number;
  totalServings: number;
  uniqueDrinks: number;
  uniqueBeers: number;
  byType: TypeStat[];
  // Beer / wine
  totalBeers: number;
  totalBeerLitres: number;
  beerSizes: BeerSizeStat[];
  wineGlasses: WineStyleStat[];
  // Rankings
  mostConsumed: NamedCount[];
  topRated: NamedRating[];
  avgRating: number | null;
  strongest: { name: string; abv: number } | null;
  totalSpent: number;
  // Time of day (sourced from when each drink was logged)
  hours: HourBucket[];
  peakHour: number | null;
  // Across the year (by logical entry date)
  monthly: MonthBucket[];
  peakMonth: number | null;
  ytd: YtdComparison | null;
  earliest: ClockExtreme | null;
  latest: ClockExtreme | null;
  // Per-day cadence
  perDay: DayCount[];
  activeDays: number;
  spanDays: number;
  avgPerActiveDay: number;
  busiestDay: DayCount | null;
  // Streaks (by logical entry date)
  longestStreak: number;
  longestDryStreak: number;
  // Sessions
  sessionCount: number;
  longestSession: SessionInfo | null;
  biggestSession: SessionInfo | null;
  avgDrinksPerSession: number;
  // Places
  places: PlaceCount[];
  mapPoints: MapPoint[];
}

interface DrinkRow {
  id: string;
  entry_date: string;
  created_at: string;
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
  city: string | null;
  country: string | null;
  latitude: number | null;
  longitude: number | null;
  drink_item: { name: string } | null;
}

const SESSION_GAP_MS = 3 * 60 * 60 * 1000; // a >3h gap starts a new session
const SESSION_TAIL_MIN = 20; // assume the last drink in a session lasts ~20 min

/** Whole-day index for a YYYY-MM-DD string, for date arithmetic. */
function dayIndex(iso: string): number {
  return Math.floor(new Date(`${iso}T00:00:00`).getTime() / 86_400_000);
}

/** Local "HH:MM" for a timestamp. */
function clockLabel(ms: number): string {
  return new Date(ms).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

/**
 * "Night-owl" minute of day: hours before the day rollover count as part of the
 * previous night, so a 02:00 drink reads as *later* than a 23:00 one. Used to pick
 * the genuinely earliest / latest drink of a night out.
 */
function nightMinute(ms: number): number {
  const d = new Date(ms);
  const h = d.getHours();
  return (h < DAY_START_HOUR ? h + 24 : h) * 60 + d.getMinutes();
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

function compute(rows: DrinkRow[]): BeverageStats {
  const empty: BeverageStats = {
    totalEntries: 0,
    totalServings: 0,
    uniqueDrinks: 0,
    uniqueBeers: 0,
    byType: [],
    totalBeers: 0,
    totalBeerLitres: 0,
    beerSizes: [],
    wineGlasses: [],
    mostConsumed: [],
    topRated: [],
    avgRating: null,
    strongest: null,
    totalSpent: 0,
    hours: Array.from({ length: 24 }, (_, hour) => ({ hour, servings: 0 })),
    peakHour: null,
    monthly: Array.from({ length: 12 }, (_, month) => ({ month, servings: 0 })),
    peakMonth: null,
    ytd: null,
    earliest: null,
    latest: null,
    perDay: [],
    activeDays: 0,
    spanDays: 0,
    avgPerActiveDay: 0,
    busiestDay: null,
    longestStreak: 0,
    longestDryStreak: 0,
    sessionCount: 0,
    longestSession: null,
    biggestSession: null,
    avgDrinksPerSession: 0,
    places: [],
    mapPoints: [],
  };
  if (!rows.length) return empty;

  const servingsOf = (d: DrinkRow): number => {
    const beerTotal =
      d.count_033l + d.count_04l + d.count_05l + d.count_0568l + d.count_06l;
    return d.drink_type === 'beer' ? beerTotal || d.quantity : d.quantity;
  };

  let totalServings = 0;
  let totalBeers = 0;
  let totalBeerLitres = 0;
  let totalSpent = 0;
  let ratingSum = 0;
  let ratingN = 0;
  let strongest: { name: string; abv: number } | null = null;

  const beerSizeUnits = new Map<string, number>();
  const wineGlassesByStyle = new Map<WineStyle, number>();
  const byTypeServings = new Map<DrinkType, number>();
  const byTypeEntries = new Map<DrinkType, number>();
  const drinkCounts = new Map<string, number>();
  const drinkRatings = new Map<string, number[]>();
  const uniqueNames = new Set<string>();
  const uniqueBeerNames = new Set<string>();
  const hours: HourBucket[] = Array.from({ length: 24 }, (_, hour) => ({ hour, servings: 0 }));
  const monthly: MonthBucket[] = Array.from({ length: 12 }, (_, month) => ({ month, servings: 0 }));
  const perDayMap = new Map<string, number>();

  // Year-to-date: count drinks up to today's month/day in this year vs last year.
  const today = logicalToday();
  const thisYear = Number(today.slice(0, 4));
  const cutoffMd = today.slice(5); // "MM-DD"
  let ytdThisServings = 0;
  let ytdLastServings = 0;
  const placeMap = new Map<string, { servings: number; entries: number }>();
  const mapPoints: MapPoint[] = [];
  let earliest: ClockExtreme | null = null;
  let latest: ClockExtreme | null = null;
  let earliestKey = Infinity;
  let latestKey = -Infinity;

  for (const d of rows) {
    const servings = servingsOf(d);
    totalServings += servings;
    if (d.cost) totalSpent += d.cost;

    byTypeServings.set(d.drink_type, (byTypeServings.get(d.drink_type) ?? 0) + servings);
    byTypeEntries.set(d.drink_type, (byTypeEntries.get(d.drink_type) ?? 0) + 1);

    const name = d.drink_item?.name ?? null;
    if (name) {
      uniqueNames.add(name);
      drinkCounts.set(name, (drinkCounts.get(name) ?? 0) + servings);
    }

    if (d.drink_type === 'beer') {
      totalBeers += servings;
      if (name) uniqueBeerNames.add(name);
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
        (wineGlassesByStyle.get(d.wine_style) ?? 0) + servings,
      );
    }

    if (d.rating != null) {
      ratingSum += d.rating;
      ratingN += 1;
      if (name) {
        const arr = drinkRatings.get(name) ?? [];
        arr.push(d.rating);
        drinkRatings.set(name, arr);
      }
    }

    if (d.abv != null && name && (!strongest || d.abv > strongest.abv)) {
      strongest = { name, abv: d.abv };
    }

    // Time of day — sourced from when the drink was logged (created_at).
    const ms = new Date(d.created_at).getTime();
    if (Number.isFinite(ms)) {
      hours[new Date(ms).getHours()].servings += servings;
      const key = nightMinute(ms);
      if (key < earliestKey) {
        earliestKey = key;
        earliest = { ms, date: d.entry_date, label: clockLabel(ms) };
      }
      if (key > latestKey) {
        latestKey = key;
        latest = { ms, date: d.entry_date, label: clockLabel(ms) };
      }
    }

    perDayMap.set(d.entry_date, (perDayMap.get(d.entry_date) ?? 0) + servings);

    // Across the year — bucket by calendar month, and tally the YTD windows.
    monthly[Number(d.entry_date.slice(5, 7)) - 1].servings += servings;
    if (d.entry_date.slice(5) <= cutoffMd) {
      const year = Number(d.entry_date.slice(0, 4));
      if (year === thisYear) ytdThisServings += servings;
      else if (year === thisYear - 1) ytdLastServings += servings;
    }

    const place = [d.city, d.country].filter(Boolean).join(', ');
    if (place) {
      const cur = placeMap.get(place) ?? { servings: 0, entries: 0 };
      cur.servings += servings;
      cur.entries += 1;
      placeMap.set(place, cur);
    }

    if (d.latitude != null && d.longitude != null) {
      mapPoints.push({
        id: d.id,
        lat: d.latitude,
        lon: d.longitude,
        name: name ?? 'Drink',
        date: d.entry_date,
        rating: d.rating,
      });
    }
  }

  // Per-day cadence
  const perDay: DayCount[] = [...perDayMap.entries()]
    .map(([date, servings]) => ({ date, servings }))
    .sort((a, b) => (a.date < b.date ? -1 : 1));
  const activeDays = perDay.length;
  const busiestDay = perDay.reduce<DayCount | null>(
    (best, d) => (!best || d.servings > best.servings ? d : best),
    null,
  );
  const firstDay = perDay[0].date;
  const lastDay = perDay[perDay.length - 1].date;
  const spanDays = dayIndex(lastDay) - dayIndex(firstDay) + 1;

  // Streaks (consecutive logical days) — longest drinking run and longest dry gap.
  const dayNums = perDay.map((d) => dayIndex(d.date));
  let longestStreak = 1;
  let curStreak = 1;
  let longestDryStreak = 0;
  for (let i = 1; i < dayNums.length; i++) {
    const delta = dayNums[i] - dayNums[i - 1];
    if (delta === 1) {
      curStreak += 1;
    } else {
      if (delta - 1 > longestDryStreak) longestDryStreak = delta - 1;
      curStreak = 1;
    }
    if (curStreak > longestStreak) longestStreak = curStreak;
  }

  // Sessions — sort by log time, split on a >3h gap.
  const sorted = [...rows]
    .map((d) => ({ ms: new Date(d.created_at).getTime(), d }))
    .filter((r) => Number.isFinite(r.ms))
    .sort((a, b) => a.ms - b.ms);
  const sessions: SessionInfo[] = [];
  for (const { ms, d } of sorted) {
    const last = sessions[sessions.length - 1];
    const servings = servingsOf(d);
    if (last && ms - last.endMs + SESSION_TAIL_MIN * 60_000 <= SESSION_GAP_MS) {
      last.endMs = ms + SESSION_TAIL_MIN * 60_000;
      last.durationMin = (last.endMs - last.startMs) / 60_000;
      last.drinks += servings;
    } else {
      sessions.push({
        startMs: ms,
        endMs: ms + SESSION_TAIL_MIN * 60_000,
        durationMin: SESSION_TAIL_MIN,
        drinks: servings,
        date: d.entry_date,
      });
    }
  }
  const longestSession = sessions.reduce<SessionInfo | null>(
    (best, s) => (!best || s.durationMin > best.durationMin ? s : best),
    null,
  );
  const biggestSession = sessions.reduce<SessionInfo | null>(
    (best, s) => (!best || s.drinks > best.drinks ? s : best),
    null,
  );

  const peakBucket = hours.reduce((best, h) => (h.servings > best.servings ? h : best), hours[0]);
  const peakMonthBucket = monthly.reduce((best, m) => (m.servings > best.servings ? m : best), monthly[0]);

  const ytd: YtdComparison | null =
    ytdThisServings > 0 || ytdLastServings > 0
      ? {
          thisYear,
          lastYear: thisYear - 1,
          thisYearServings: ytdThisServings,
          lastYearServings: ytdLastServings,
          throughLabel: new Date(`${today}T00:00:00`).toLocaleDateString([], {
            day: 'numeric',
            month: 'short',
          }),
        }
      : null;

  const byType: TypeStat[] = [...byTypeServings.entries()]
    .map(([type, servings]) => ({ type, servings, entries: byTypeEntries.get(type) ?? 0 }))
    .sort((a, b) => b.servings - a.servings);

  const beerSizes: BeerSizeStat[] = BEER_SIZES.filter((s) => beerSizeUnits.get(s.key)).map((s) => {
    const units = beerSizeUnits.get(s.key)!;
    return { key: s.key, short: s.short, units, litres: units * s.liters };
  });
  const wineGlasses: WineStyleStat[] = WINE_STYLES.filter((w) => wineGlassesByStyle.get(w.value)).map(
    (w) => ({ style: w.value, label: w.label, glasses: wineGlassesByStyle.get(w.value)! }),
  );

  const places: PlaceCount[] = [...placeMap.entries()]
    .map(([name, v]) => ({ name, servings: v.servings, entries: v.entries }))
    .sort((a, b) => b.servings - a.servings);

  return {
    totalEntries: rows.length,
    totalServings,
    uniqueDrinks: uniqueNames.size,
    uniqueBeers: uniqueBeerNames.size,
    byType,
    totalBeers,
    totalBeerLitres,
    beerSizes,
    wineGlasses,
    mostConsumed: topCounts(drinkCounts),
    topRated: topRatings(drinkRatings),
    avgRating: ratingN ? ratingSum / ratingN : null,
    strongest,
    totalSpent,
    hours,
    peakHour: peakBucket.servings > 0 ? peakBucket.hour : null,
    monthly,
    peakMonth: peakMonthBucket.servings > 0 ? peakMonthBucket.month : null,
    ytd,
    earliest,
    latest,
    perDay,
    activeDays,
    spanDays,
    avgPerActiveDay: activeDays ? totalServings / activeDays : 0,
    busiestDay,
    longestStreak,
    longestDryStreak,
    sessionCount: sessions.length,
    longestSession,
    biggestSession,
    avgDrinksPerSession: sessions.length ? totalServings / sessions.length : 0,
    places,
    mapPoints,
  };
}

/**
 * Deep beverage analytics for the Beverages stats screen.
 *   - undefined → loading, query disabled
 *   - null      → "Everything" mode, all projects included
 *   - string    → specific project filter
 * Optional `from`/`to` (YYYY-MM-DD) bound the entry dates inclusively.
 */
export function useBeverageStats(
  projectId: string | null | undefined,
  from?: string,
  to?: string,
) {
  return useQuery({
    queryKey: ['stats', 'beverages', projectId, from, to],
    enabled: projectId !== undefined,
    queryFn: async (): Promise<BeverageStats> => {
      let q = supabase
        .from('memoir_drink_entries')
        .select(
          'id, entry_date, created_at, drink_type, wine_style, abv, count_033l, count_04l, count_05l, count_0568l, count_06l, quantity, rating, cost, city, country, latitude, longitude, drink_item:memoir_drink_items(name)',
        );
      if (projectId !== null) q = q.eq('project_id', projectId);
      if (from) q = q.gte('entry_date', from);
      if (to) q = q.lte('entry_date', to);
      const { data, error } = await q;
      if (error) throw error;
      return compute((data ?? []) as unknown as DrinkRow[]);
    },
  });
}
