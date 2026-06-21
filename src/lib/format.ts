import { format, parseISO } from 'date-fns';
import type { Currency, DateFormat, RatingScale, Settings } from '@/types/db';

// ISO date helpers (entry_date is a plain YYYY-MM-DD string, no timezone).
export function todayISO(): string {
  const d = new Date();
  return toISODate(d);
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
 * Parse a number from free text, accepting both ',' and '.' as the decimal
 * separator so the value is always normalised to a JS number (stored with ".").
 */
export function parseDecimal(raw: string): number | null {
  const cleaned = raw.replace(',', '.').replace(/[^0-9.]/g, '');
  if (!cleaned || cleaned === '.') return null;
  const n = parseFloat(cleaned);
  return Number.isFinite(n) ? n : null;
}
