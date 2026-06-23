import { useEffect, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';
import { currencySymbol } from '@/lib/format';
import type { Currency } from '@/types/db';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  currency: Currency;
  /**
   * When provided, the currency symbol becomes a button that lets the user pick a
   * different currency inline. The chosen currency is reported here so the caller
   * can persist it (e.g. as the default for future entries).
   */
  onCurrencyChange?: (currency: Currency) => void;
  placeholder?: string;
}

const CURRENCY_OPTIONS: { value: Currency; label: string }[] = [
  { value: 'NOK', label: 'kr · NOK' },
  { value: 'EUR', label: '€ · EUR' },
  { value: 'USD', label: '$ · USD' },
  { value: 'Other', label: '¤ · Other' },
];

/** Short glyph shown on the picker button (falls back to a generic mark). */
function badge(currency: Currency): string {
  return currencySymbol(currency) || (currency === 'Other' ? '¤' : currency);
}

export function CurrencyInput({
  value,
  onChange,
  currency,
  onCurrencyChange,
  placeholder = '0',
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const interactive = !!onCurrencyChange;
  const symbol = currencySymbol(currency);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [menuOpen]);

  return (
    <div className="relative" ref={ref}>
      {interactive ? (
        <button
          type="button"
          onClick={() => setMenuOpen((o) => !o)}
          aria-label="Change currency"
          className={cn(
            'absolute left-1.5 top-1/2 z-10 flex -translate-y-1/2 items-center gap-0.5 rounded-lg px-1.5 py-1',
            'text-sm font-medium text-text-muted transition hover:bg-surface-alt hover:text-text',
          )}
        >
          {badge(currency)}
          <ChevronDown size={13} />
        </button>
      ) : (
        symbol && (
          <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
            {symbol}
          </span>
        )
      )}

      <input
        type="number"
        inputMode="decimal"
        min={0}
        step="0.01"
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const v = e.target.value;
          onChange(v === '' ? null : Number(v));
        }}
        className={cn(
          'w-full bg-surface border border-border rounded-xl h-11 text-[15px] text-text',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition',
          interactive ? 'pl-16 pr-3.5' : symbol ? 'pl-8 pr-3.5' : 'px-3.5',
        )}
      />

      {interactive && menuOpen && (
        <div className="absolute left-0 top-[calc(100%+4px)] z-20 w-40 overflow-hidden rounded-xl border border-border bg-surface shadow-soft">
          {CURRENCY_OPTIONS.map((o) => (
            <button
              key={o.value}
              type="button"
              onClick={() => {
                onCurrencyChange!(o.value);
                setMenuOpen(false);
              }}
              className={cn(
                'flex w-full items-center px-3 py-2 text-left text-sm transition hover:bg-surface-alt',
                o.value === currency ? 'font-semibold text-primary' : 'text-text',
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
