import { cn } from '@/lib/cn';
import { currencySymbol } from '@/lib/format';
import type { Currency } from '@/types/db';

interface Props {
  value: number | null;
  onChange: (value: number | null) => void;
  currency: Currency;
  placeholder?: string;
}

export function CurrencyInput({ value, onChange, currency, placeholder = '0' }: Props) {
  const symbol = currencySymbol(currency);
  return (
    <div className="relative">
      {symbol && (
        <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted">
          {symbol}
        </span>
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
          symbol ? 'pl-8 pr-3.5' : 'px-3.5',
        )}
      />
    </div>
  );
}
