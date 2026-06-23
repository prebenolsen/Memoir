import { format, parseISO } from 'date-fns';
import { BEER_EMPTY_NAME, WINE_EMPTY_NAMES } from '@/types/db';
import type { Currency, DateFormat, RatingScale, Settings } from '@/types/db';

// ISO date helpers (entry_date is a plain YYYY-MM-DD string, no timezone).
export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
}

/**
 * The hour (local time) at which the journal rolls over to a new day. A night
 * out that runs past midnight should stay on the same logical day, so we treat
 * anything before this hour as still belonging to the previous calendar date.
 */
export const DAY_START_HOUR = 6;

/**
 * The current logical journal date. Between midnight and DAY_START_HOUR this is
 * still yesterday, so late-night entries land on the day the night started.
 */
export function logicalToday(): string {
  return toISODate(new Date(Date.now() - DAY_START_HOUR * 3600_000));
}

export function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function addDays(iso: string, delta: number): string {
  const d = parseISO(iso);
  d.setDate(d.getDate() + delta);
  return toISODate(d);
}

const DATE_FNS_PATTERN: Record<DateFormat, string> = {
  'DD.MM.YYYY': 'dd.MM.yyyy',
  'MM/DD/YYYY': 'MM/dd/yyyy',
  'YYYY-MM-DD': 'yyyy-MM-dd',
};

export function formatDate(iso: string, fmt: DateFormat): string {
  try {
    return format(parseISO(iso), DATE_FNS_PATTERN[fmt]);
  } catch {
    return iso;
  }
}

/** Long, human form for the Today header, e.g. "20 June 2026". */
export function formatLongDate(iso: string): string {
  try {
    return format(parseISO(iso), 'd MMMM yyyy');
  } catch {
    return iso;
  }
}

export function formatWeekday(iso: string): string {
  try {
    return format(parseISO(iso), 'EEEE');
  } catch {
    return '';
  }
}

const CURRENCY_INFO: Record<Currency, { code: string; symbol: string }> = {
  NOK: { code: 'NOK', symbol: 'kr' },
  EUR: { code: 'EUR', symbol: '€' },
  USD: { code: 'USD', symbol: '$' },
  Other: { code: '', symbol: '' },
};

export function formatMoney(amount: number | null | undefined, currency: Currency): string {
  if (amount == null) return '—';
  const info = CURRENCY_INFO[currency];
  const n = amount.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  if (currency === 'EUR' || currency === 'USD') return `${info.symbol}${n}`;
  if (currency === 'NOK') return `${n} ${info.symbol}`;
  return n;
}

export function currencySymbol(currency: Currency): string {
  return CURRENCY_INFO[currency].symbol || '';
}

/** Display a rating against the chosen scale, e.g. 8 on a 1-5 scale -> "4". */
export function formatRating(
  rating: number | null | undefined,
  scale: RatingScale,
): string | null {
  if (rating == null) return null;
  // Ratings are stored on a 1-10 scale; show on a 1-5 scale when configured.
  const value = scale === 5 ? Math.round((rating / 10) * 5 * 10) / 10 : Math.round(rating * 10) / 10;
  return `${value}/${scale}`;
}

/** Effective settings = user settings merged with the active project override. */
export function effectiveSettings(
  settings: Settings,
  override: Partial<Settings> | null | undefined,
): Settings {
  return override ? { ...settings, ...override } : settings;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback (older browsers): RFC4122-ish v4.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function titleCase(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Display an ABV percentage without a trailing ".0" (e.g. "5", "4.7", "12.5"). */
export function formatAbv(v: number): string {
  const r = Math.round(v * 10) / 10;
  return Number.isInteger(r) ? String(r) : r.toFixed(1);
}

/**
 * Reduce a beer/wine name to its clean product term by stripping any trailing
 * serving size ("0.33l", "33cl", "330ml") and ABV percentage ("(4.7 %)",
 * ", 4.7 %", " 4.7%") — in any order and possibly repeated. We store only this
 * clean name on the reusable drink item; the size lives in the entry's count
 * columns and the ABV in the entry's `abv` column, so the same beer is a single
 * item no matter how it was served. Display (and the input cards) compose the
 * size/percentage back from those fields, keeping every entry consistent.
 */
export function baseDrinkName(name: string): string {
  let s = name.trim();
  let prev = '';
  while (s && s !== prev) {
    prev = s;
    s = s
      .replace(/\s*\(\s*[\d.,]+\s*%\s*\)\s*$/i, '') // "(4.7 %)"
      .replace(/[,;]?\s*[\d.,]+\s*%\s*$/i, '') // ", 4.7 %" / " 4.7%"
      .replace(/[,;]?\s*\d+(?:[.,]\d+)?\s*(?:l|cl|ml)\s*$/i, '') // " 0.33l" / " 33cl"
      .trim();
  }
  return s;
}

/**
 * Reduce a stored drink name to a clean term for an Open Food Facts photo search.
 * Same stripping as {@link baseDrinkName} so brand/product matching is reliable.
 */
export function drinkSearchTerm(name: string): string {
  return baseDrinkName(name);
}

/** Auto-generated fallback drink names (e.g. "0.33l of beer", "A glass of red"). */
const GENERIC_DRINK_NAMES = new Set<string>([
  BEER_EMPTY_NAME.toLowerCase(),
  ...Object.values(WINE_EMPTY_NAMES).map((n) => n.toLowerCase()),
]);

/**
 * True for the generated default names a blank beer/wine entry falls back to.
 * These describe no real product, so we skip the photo lookup for them.
 */
export function isGenericDrinkName(name: string): boolean {
  return GENERIC_DRINK_NAMES.has(name.trim().toLowerCase());
}

/**
 * Parse a number from free text, accepting both ',' and '.' as the decimal
 * separator so the value is always normalised to a JS number (stored with ".").
 */
export function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
