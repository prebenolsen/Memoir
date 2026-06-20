import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

interface Props<T extends string> {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  className?: string;
}

export function Select<T extends string>({ value, onChange, options, className }: Props<T>) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className={cn(
          'appearance-none rounded-xl border border-border bg-surface py-2 pl-3 pr-9 text-[15px] text-text',
          'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20',
          className,
        )}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
      />
    </div>
  );
}
