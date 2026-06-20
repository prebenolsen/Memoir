import { cn } from '@/lib/cn';

interface Props {
  value: string; // YYYY-MM-DD
  onChange: (iso: string) => void;
  className?: string;
}

export function DateField({ value, onChange, className }: Props) {
  return (
    <input
      type="date"
      value={value}
      onChange={(e) => e.target.value && onChange(e.target.value)}
      className={cn(
        'w-full rounded-xl border border-border bg-surface h-11 px-3.5 text-[15px] text-text',
        'focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition',
        className,
      )}
    />
  );
}
